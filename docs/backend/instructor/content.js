

// ============================================================================
// CONTENT MANAGEMENT APIs
// ============================================================================

/**
 * Add content (Note/MCQ) to a module
 * POST /api/instructor/courses/:courseId/modules/:moduleId/content
 */
export async function addModuleContent(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const { courseId, moduleId } = req.params;
        const {
            type, title, sequence_order, is_required,
            body, question, options, correct_answer, explanation, difficulty
        } = req.body;

        // Validations
        if (!Object.values(CourseContentType).includes(type)) {
            return res.status(400).json({ message: 'Invalid content type' });
        }

        // Verify ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { Instructor: true }
        });

        if (!course || course.Instructor?.userId !== appUserId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Verify module in course
        const courseModule = await prisma.courseModule.findUnique({
            where: {
                course_id_module_id: { course_id: courseId, module_id: moduleId }
            }
        });

        if (!courseModule) {
            return res.status(404).json({ message: 'Module not found in this course' });
        }

        // Analyze content for concept generation
        let textToAnalyze = "";
        if (type === "NOTES") textToAnalyze = body || "";
        else if (type === "MCQ") textToAnalyze = question || "";

        if (!textToAnalyze || textToAnalyze.length < 10) {
            // Fallback if content is too short, rely on title
            textToAnalyze = `${title} ${title} ${title}`;
        }

        const analysisResult = await analyzeContentToConcept({
            text: textToAnalyze,
            title: title,
            sourceType: type === "NOTES" ? "note" : "text"
        });

        const result = await createModuleContent({
            moduleId,
            type,
            title,
            sequence_order,
            is_required,
            body,
            question,
            options,
            correct_answer,
            explanation,
            difficulty,
            analysisResult
        });

        if (!result.success) {
            return res.status(500).json({ message: result.error });
        }

        res.status(201).json({
            message: 'Content added successfully',
            data: result
        });

    } catch (error) {
        console.error('addModuleContent error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Update module content
 * PUT /api/instructor/courses/:courseId/modules/:moduleId/content/:contentId
 */
export async function updateModuleContent(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const { courseId, moduleId, contentId } = req.params;
        const updates = req.body;

        // Verify ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { Instructor: true }
        });

        if (!course || course.Instructor?.userId !== appUserId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Verify content linkage (optional but recommended)
        // Check if content belongs to a concept in the module?
        // For simplicity, we assume if you have the ID and are the instructor of the course, it's okay.
        // But verifying module linkage is safer.

        // TODO: Strict chain verification if needed.

        const result = await updateModuleContentService(contentId, updates);

        if (!result.success) {
            return res.status(500).json({ message: result.error });
        }

        res.json({
            message: 'Content updated successfully',
            data: result
        });

    } catch (error) {
        console.error('updateModuleContent error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Delete module content
 * DELETE /api/instructor/courses/:courseId/modules/:moduleId/content/:contentId
 */
export async function deleteModuleContent(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const { courseId, moduleId, contentId } = req.params;

        // Verify ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { Instructor: true }
        });

        if (!course || course.Instructor?.userId !== appUserId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const success = await deleteModuleContentService(contentId);

        if (!success) {
            return res.status(500).json({ message: 'Failed to delete content' });
        }

        res.json({ message: 'Content deleted successfully' });

    } catch (error) {
        console.error('deleteModuleContent error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}



/**
 * Get module content details for editing
 * GET /api/instructor/courses/:courseId/modules/:moduleId
 */
export async function getInstructorModuleContent(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const { courseId, moduleId } = req.params;

        // Verify ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { Instructor: true }
        });

        if (!course || course.Instructor?.userId !== appUserId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Fetch module with full hierarchy
        const courseModule = await prisma.courseModule.findUnique({
            where: {
                course_id_module_id: { course_id: courseId, module_id: moduleId }
            },
            include: {
                Module: {
                    include: {
                        ModuleConcept: {
                            orderBy: { order_index: 'asc' },
                            include: {
                                Concept: {
                                    include: {
                                        CourseContentItem: {
                                            orderBy: { sequence_order: 'asc' },
                                            include: {
                                                Note: true,
                                                MCQ: true // Include full MCQ details including correct answer
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!courseModule) {
            return res.status(404).json({ message: 'Module not found in this course' });
        }

        // Structure the response for the frontend editor
        let globalIndex = 0;
        const contentItems: Array<{
            index: number;
            id: string;
            type: string;
            title: string | null;
            is_required: boolean | null;
            concept_order: number;
            sequence_order: number | null;
            concept: {
                id: string;
                slug: string;
                learningObjective: string;
                keywords: string[];
                domain: string;
                baseConceptId: string;
            };
            content: any;
        }> = [];

        for (const mc of courseModule.Module.ModuleConcept) {
            for (const item of mc.Concept.CourseContentItem) {
                contentItems.push({
                    index: globalIndex++,
                    id: item.id,
                    type: item.content_kind,
                    title: item.title,
                    is_required: item.is_required,
                    concept_order: mc.order_index,
                    sequence_order: item.sequence_order,
                    concept: {
                        id: mc.Concept.id,
                        slug: mc.Concept.conceptSlug,
                        learningObjective: mc.Concept.learningObjective,
                        keywords: mc.Concept.keywords,
                        domain: mc.Concept.domain,
                        baseConceptId: mc.Concept.baseConceptId
                    },
                    content: item.content_kind === 'NOTES' ? item.Note : item.MCQ
                });
            }
        }

        res.json({
            data: {
                module: {
                    id: courseModule.Module.id,
                    title: courseModule.Module.title,
                    description: courseModule.Module.description,
                    domain: courseModule.Module.domain,
                    order_index: courseModule.order_index,
                },
                contentItems
            }
        });

    } catch (error) {
        console.error('getInstructorModuleContent error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
