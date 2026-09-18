Content Management APIs Walkthrough
I have implemented the backend APIs for creating, updating, and deleting module content (Notes and MCQs).

Changes Implemented

1. Service Layer (
src/services/conceptDbService.ts
)
Implemented
createModuleContent
:
Handles AI-driven concept generation integration.
Creates
Concept
 (new instance per content).
Links
Concept
 to
Module
 (ModuleConcept).
Creates CourseContentItem.
Creates specific Note or MCQ record.
Uses atomic transaction to ensure data integrity.
Implemented
updateModuleContent
:
Updates common fields (title, required status).
Updates specific fields (body for Notes; questions/options/etc for MCQ).
Implemented
deleteModuleContent
:
Deletes CourseContentItem.
Cleans up associated
Concept
 and ModuleConcept link.
2. Controller Layer (
src/controllers/instructorController.ts
)
Added
addModuleContent
:
Validates content type (NOTES, MCQ).
Verifies instructor ownership of the course.
Calls
analyzeContentToConcept
 using content body/question.
Calls
createModuleContent
 service.
Added
updateModuleContent
:
Verifies ownership.
Calls update service.
Added
deleteModuleContent
:
Verifies ownership.
Calls delete service.
3. Routes (
src/routes/instructorRoutes.ts
)
POST /api/instructor/courses/:courseId/modules/:moduleId/content
PUT /api/instructor/courses/:courseId/modules/:moduleId/content/:contentId
DELETE /api/instructor/courses/:courseId/modules/:moduleId/content/:contentId
Verification
Creation: The system now supports sending a body like:
{
  "type": "MCQ",
  "title": "Network OSI Model",
  "sequence_order": 1,
  "question": "Which layer is responsible for routing?",
  "options": [{"id": "A", "text": "Layer 2"}, {"id": "B", "text": "Layer 3"}],
  "correct_answer": "B"
}
Atomicity: If any step fails (e.g., MCQ creation), the entire transaction rolls back, preventing orphaned concepts.
AI Integration: The content is automatically analyzed to generate metadata (concept slug, keywords) using the existing Gemini integration.
