// This file is for documentation purposes only - replica of express backend running

router.get('api/instructor/courses', instructorController.getInstructorCourses);

export async function getInstructorCourses(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const {
            page = 1,
            limit = 10,
            search = '',
            is_published,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const instructor = await prisma.instructor.findUnique({
            where: { userId: appUserId },
        });

        if (!instructor) {
            return res.status(404).json({ message: 'Instructor profile not found' });
        }

        // Build where clause
        const where: any = {
            instructorId: instructor.id,
        };

        if (search) {
            where.OR = [
                { title: { contains: String(search), mode: 'insensitive' } },
                { description: { contains: String(search), mode: 'insensitive' } },
            ];
        }

        if (is_published !== undefined) {
            where.is_published = is_published === 'true';
        }

        // Execute query and count in parallel for efficiency
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take,
                orderBy: { [String(sortBy)]: sortOrder },
                include: {
                    _count: {
                        select: {
                            UserCourseEnrollment: true
                        }
                    }
                }
            }),
            prisma.course.count({ where })
        ]);

        const totalPages = Math.ceil(total / take);

        res.json({
            data: courses,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages
            }
        });
    } catch (error) {
        console.error('getInstructorCourses error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


router.post('api/instructor/courses', instructorController.createInstructorCourse);
export async function createInstructorCourse(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const {
            title,
            Name,
            description,
            domainId,
            difficulty,
            price,
            duration_minutes
        } = req.body;

        const courseTitle = title || Name;

        if (!courseTitle || !domainId) {
            return res.status(400).json({ message: 'Title (or Name) and domainId are required' });
        }

        const course = await prisma.$transaction(async (tx) => {
            let instructor = await tx.instructor.findUnique({
                where: { userId: appUserId },
            });

            // Automatically create instructor profile if it doesn't exist
            if (!instructor) {
                instructor = await tx.instructor.create({
                    data: {
                        userId: appUserId,
                    },
                });
            }

            // Generate a unique slug in the backend
            const slug = `${slugify(courseTitle)}-${Math.random().toString(36).substring(2, 7)}`;

            return await tx.course.create({
                data: {
                    title: courseTitle,
                    description,
                    domainId,
                    difficulty: difficulty?.toUpperCase(), // Ensure uppercase for enum
                    duration_minutes: duration_minutes ? Number(duration_minutes) : null,
                    price,
                    slug,
                    is_published: false, // Default to false for new courses
                    instructorId: instructor.id, // Correct instructor profile ID logic
                },
            });
        });

        res.status(201).json(course);
    } catch (error) {
        console.error('createInstructorCourse error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

app.use('/api/domains', domainRoutes);

GET /api/domains
export async function getDomains(req: Request, res: Response) {
    try {
        const domains = await prisma.domain.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(domains);
    } catch (error) {
        console.error('getDomains error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

POST /api/domains
export async function createDomain(req: Request, res: Response) {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Domain name is required' });
        }

        const slug = slugify(name);

        const domain = await prisma.domain.create({
            data: {
                name,
                description,
                slug,
            },
        });

        res.status(201).json(domain);
    } catch (error) {
        console.error('createDomain error:', error);
        // Handle unique constraint violation for slug or name
        if ((error as any).code === 'P2002') {
            return res.status(400).json({ message: 'Domain with this name or slug already exists' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}


PUT /api/instructor/courses/:id
router.put('/courses/:id', instructorController.updateInstructorCourse);
export async function updateInstructorCourse(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const { id } = req.params;
        const { title, description, difficulty, price, is_published, domainId } = req.body;

        const course = await prisma.course.findUnique({
            where: { id },
            include: { Instructor: true }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.Instructor?.userId !== appUserId) {
            return res.status(403).json({ message: 'Not authorized to update this course' });
        }

        const updateData: any = {
            description,
            difficulty,
            price,
            is_published,
            domainId,
            updated_at: new Date()
        };

        if (title && title !== course.title) {
            updateData.title = title;
            // Only update slug if not published yet to preserve SEO
            if (!course.is_published) {
                updateData.slug = `${slugify(title)}-${Math.random().toString(36).substring(2, 7)}`;
            }
        }

        const updatedCourse = await prisma.course.update({
            where: { id },
            data: updateData
        });

        res.json(updatedCourse);
    } catch (error) {
        console.error('updateInstructorCourse error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


router.delete('/courses/:id', instructorController.deleteInstructorCourse);
export async function deleteInstructorCourse(req: AuthRequest, res: Response) {
    try {
        const appUserId = (req as any).appUserId;
        const { id } = req.params;

        const course = await prisma.course.findUnique({
            where: { id },
            include: { Instructor: true }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.Instructor?.userId !== appUserId) {
            return res.status(403).json({ message: 'Not authorized to delete this course' });
        }

        await prisma.course.delete({
            where: { id }
        });

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('deleteInstructorCourse error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}