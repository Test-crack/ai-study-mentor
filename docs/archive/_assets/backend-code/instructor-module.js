===============================================================
// MODULE MANAGEMENT APIs
// ============================================================================

/**
 * Get all modules for a specific course owned by the instructor
 * GET /api/instructor/courses/:courseId/modules
 */
export async function getCourseModules(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const { courseId } = req.params;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(courseId)) {
            return res.status(400).json({ message: 'Invalid course ID format' });
        }

        // Verify instructor owns the course
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { Instructor: true }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.Instructor?.userId !== appUserId) {
            return res.status(403).json({ message: 'Not authorized to access this course' });
        }

        // Fetch modules with their details
        const courseModules = await prisma.courseModule.findMany({
            where: { course_id: courseId },
            orderBy: { order_index: 'asc' },
            include: {
                Module: {
                    include: {
                        _count: {
                            select: { ModuleConcept: true }
                        }
                    }
                }
            }
        });

        const modules = courseModules.map(cm => ({
            id: cm.Module.id,
            title: cm.Module.title,
            description: cm.Module.description,
            domain: cm.Module.domain,
            order_index: cm.order_index,
            courseModuleId: cm.id,
            conceptCount: cm.Module._count.ModuleConcept,
            created_at: cm.Module.created_at,
            updated_at: cm.Module.updated_at,
        }));

        res.json({
            data: modules,
            meta: { total: modules.length }
        });
    } catch (error) {
        console.error('getCourseModules error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Add a new module to a course
 * POST /api/instructor/courses/:courseId/modules
 */
export async function addCourseModule(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const { courseId } = req.params;
        const { title, description, domain, order_index } = req.body;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(courseId)) {
            return res.status(400).json({ message: 'Invalid course ID format' });
        }

        // Validate required fields
        if (!title || title.trim().length === 0) {
            return res.status(400).json({ message: 'Title is required' });
        }

        // Verify instructor owns the course
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { Instructor: true }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.Instructor?.userId !== appUserId) {
            return res.status(403).json({ message: 'Not authorized to modify this course' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Get current max order_index for this course
            const maxOrderResult = await tx.courseModule.aggregate({
                where: { course_id: courseId },
                _max: { order_index: true }
            });
            const currentMaxIndex = maxOrderResult._max.order_index ?? -1;

            // Determine target order_index
            let targetIndex: number;
            if (order_index !== undefined && order_index !== null) {
                targetIndex = Math.max(0, Math.min(order_index, currentMaxIndex + 1));

                // Shift existing modules if inserting in the middle
                if (targetIndex <= currentMaxIndex) {
                    await tx.courseModule.updateMany({
                        where: {
                            course_id: courseId,
                            order_index: { gte: targetIndex }
                        },
                        data: {
                            order_index: { increment: 1 }
                        }
                    });
                }
            } else {
                // Append at end
                targetIndex = currentMaxIndex + 1;
            }

            // Create the module
            const newModule = await tx.module.create({
                data: {
                    title: title.trim(),
                    description: description?.trim() || null,
                    domain: domain?.trim() || null,
                }
            });

            // Link module to course
            const courseModule = await tx.courseModule.create({
                data: {
                    course_id: courseId,
                    module_id: newModule.id,
                    order_index: targetIndex,
                }
            });

            return { module: newModule, courseModule };
        });

        res.status(201).json({
            message: 'Module added successfully',
            data: {
                id: result.module.id,
                title: result.module.title,
                description: result.module.description,
                domain: result.module.domain,
                order_index: result.courseModule.order_index,
                courseModuleId: result.courseModule.id,
                created_at: result.module.created_at,
            }
        });
    } catch (error) {
        console.error('addCourseModule error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Update a module linked to a course
 * PUT /api/instructor/courses/:courseId/modules/:moduleId
 */
export async function updateCourseModule(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const { courseId, moduleId } = req.params;
        const { title, description, domain, order_index } = req.body;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(courseId) || !uuidRegex.test(moduleId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // Verify instructor owns the course
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { Instructor: true }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.Instructor?.userId !== appUserId) {
            return res.status(403).json({ message: 'Not authorized to modify this course' });
        }

        // Verify module is linked to this course
        const existingCourseModule = await prisma.courseModule.findUnique({
            where: {
                course_id_module_id: {
                    course_id: courseId,
                    module_id: moduleId
                }
            }
        });

        if (!existingCourseModule) {
            return res.status(404).json({ message: 'Module not found in this course' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Handle order_index change if specified
            if (order_index !== undefined && order_index !== existingCourseModule.order_index) {
                const maxOrderResult = await tx.courseModule.aggregate({
                    where: { course_id: courseId },
                    _max: { order_index: true }
                });
                const maxIndex = maxOrderResult._max.order_index ?? 0;
                const newIndex = Math.max(0, Math.min(order_index, maxIndex));
                const oldIndex = existingCourseModule.order_index;

                if (newIndex !== oldIndex) {
                    // Temporarily set to -1 to avoid unique constraint violation
                    await tx.courseModule.update({
                        where: { id: existingCourseModule.id },
                        data: { order_index: -1 }
                    });

                    if (newIndex > oldIndex) {
                        // Moving down: shift items between old and new up
                        await tx.courseModule.updateMany({
                            where: {
                                course_id: courseId,
                                order_index: { gt: oldIndex, lte: newIndex }
                            },
                            data: { order_index: { decrement: 1 } }
                        });
                    } else {
                        // Moving up: shift items between new and old down
                        await tx.courseModule.updateMany({
                            where: {
                                course_id: courseId,
                                order_index: { gte: newIndex, lt: oldIndex }
                            },
                            data: { order_index: { increment: 1 } }
                        });
                    }

                    // Set final position
                    await tx.courseModule.update({
                        where: { id: existingCourseModule.id },
                        data: { order_index: newIndex }
                    });
                }
            }

            // Update module details
            const updateData: { title?: string; description?: string | null; domain?: string | null; updated_at: Date } = {
                updated_at: new Date()
            };

            if (title !== undefined) updateData.title = title.trim();
            if (description !== undefined) updateData.description = description?.trim() || null;
            if (domain !== undefined) updateData.domain = domain?.trim() || null;

            const updatedModule = await tx.module.update({
                where: { id: moduleId },
                data: updateData
            });

            // Fetch updated course module for order_index
            const updatedCourseModule = await tx.courseModule.findUnique({
                where: {
                    course_id_module_id: {
                        course_id: courseId,
                        module_id: moduleId
                    }
                }
            });

            return { module: updatedModule, courseModule: updatedCourseModule };
        });

        res.json({
            message: 'Module updated successfully',
            data: {
                id: result.module.id,
                title: result.module.title,
                description: result.module.description,
                domain: result.module.domain,
                order_index: result.courseModule?.order_index,
                courseModuleId: result.courseModule?.id,
                updated_at: result.module.updated_at,
            }
        });
    } catch (error) {
        console.error('updateCourseModule error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Delete/unlink a module from a course
 * DELETE /api/instructor/courses/:courseId/modules/:moduleId
 * Query param: deleteModule=true to also delete the module if not linked elsewhere
 */
export async function deleteCourseModule(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const { courseId, moduleId } = req.params;
        const deleteModule = req.query.deleteModule === 'true';

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(courseId) || !uuidRegex.test(moduleId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // Verify instructor owns the course
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { Instructor: true }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.Instructor?.userId !== appUserId) {
            return res.status(403).json({ message: 'Not authorized to modify this course' });
        }

        // Verify module is linked to this course
        const existingCourseModule = await prisma.courseModule.findUnique({
            where: {
                course_id_module_id: {
                    course_id: courseId,
                    module_id: moduleId
                }
            }
        });

        if (!existingCourseModule) {
            return res.status(404).json({ message: 'Module not found in this course' });
        }

        let moduleDeleted = false;

        await prisma.$transaction(async (tx) => {
            const deletedIndex = existingCourseModule.order_index;

            // Remove the course-module link
            await tx.courseModule.delete({
                where: { id: existingCourseModule.id }
            });

            // Shift remaining modules down to maintain contiguous indices
            await tx.courseModule.updateMany({
                where: {
                    course_id: courseId,
                    order_index: { gt: deletedIndex }
                },
                data: { order_index: { decrement: 1 } }
            });

            // Optionally delete the module if not linked elsewhere
            if (deleteModule) {
                const otherLinks = await tx.courseModule.count({
                    where: { module_id: moduleId }
                });

                if (otherLinks === 0) {
                    await tx.module.delete({
                        where: { id: moduleId }
                    });
                    moduleDeleted = true;
                }
            }
        });

        res.json({
            message: moduleDeleted
                ? 'Module deleted successfully'
                : 'Module removed from course successfully',
            moduleDeleted
        });
    } catch (error) {
        console.error('deleteCourseModule error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
