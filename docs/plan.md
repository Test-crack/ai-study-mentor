# TestCrack Platform Specification (MVP)

**Version:** 1.0  
**Status:** Draft / In-Development  
**Core Vision:** An AI-integrated EdTech ecosystem bridging self-paced learning, instructor-led coaching, and institutional management.

---

## 1. Executive Summary

TestCrack is a three-sided marketplace and learning management system (LMS) designed to simplify learning through AI. It serves:

1. **Students:** Standalone learners using AI tools (Freemium).
2. **Instructors:** Educators creating content and tracking progress.
3. **Institutions:** Coaching centers managing batches, mappings, and oversight.

---

## 2. Landing Page Architecture

*Design Philosophy: "The Intelligent Canvas" — Clean, High-Tech, Glassmorphism elements.*

### 2.1 Hero Section (The Hook)

* **Headline:** Dynamic Typewriter Effect — "Simplify **Learning** / **Teaching** / **Management**."
* **Sub-headline:** "The AI-first ecosystem for the modern education era."
* **Core Interaction:** A centralized **Role Toggle Switcher** (Tab Component).

### 2.2 The Role-Based Feature Grid

*The content below the Hero changes dynamically based on the selected tab.*

#### 🎓 Tab A: Students (B2C)

| Feature Card | Description |
| :--- | :--- |
| **AI Study Vault** | Paste a YouTube link, get instant structured notes and summaries. |
| **Smart Assessment** | Real-time AI feedback on Reading and Speech (IELTS/PTE focus). |
| **Marketplace** | Buy specialized courses from top independent instructors. |
| **Direct Connect** | "Ask a Query" feature to connect with mapped instructors. |

#### 👨‍🏫 Tab B: Instructors (Creator Economy)

| Feature Card | Description |
| :--- | :--- |
| **Content Factory** | AI-assisted course creation (auto-generate quizzes/materials). |
| **Student Insights** | Granular data on where mapped students are struggling. |
| **Batch Management** | Tools to assign homework and track completion rates. |
| **Monetization** | Sell courses directly to standalone students or institutions. |

#### 🏛️ Tab C: Institutions (B2B Enterprise)

| Feature Card | Description |
| :--- | :--- |
| **Command Center** | Bird's-eye view of all Batches, Instructors, and Students. |
| **Smart Mapping** | Many-to-Many mapping logic (Student $\leftrightarrow$ Instructor). |
| **Premium Scaling** | Bulk license management for AI features. |
| **Performance ROI** | Aggregate reports on institutional pass rates/scores. |

---

## 3. Core Application Modules (Dashboards)

### 3.1 Student Dashboard (The Learner's Cockpit)

* **Subscription Model:** Freemium (Basic AI tools free; Advanced courses/features paid).
* **Key Modules:**
  * **My Learning Path:** List of enrolled courses and progress bars.
  * **AI Toolbox:**
    * *YouTube Transcriber:* Input URL $\rightarrow$ Output Markdown Notes.
    * *Speech Trainer:* Audio recording interface with AI pronunciation scoring.
    * *Reading Assistant:* Comprehension tests with instant feedback.
  * **The Classroom:** Interface to view instructor content and submit assignments.
  * **Query Hub:** Chat interface to ask questions to mapped instructors.

### 3.2 Instructor Dashboard (The Teacher's Studio)

* **Key Modules:**
  * **Course Builder:** Drag-and-drop interface to upload video, text, and PDFs.
  * **AI Generator:** "Create Quiz from Text" button.
  * **Student Tracker:** List of mapped students with "Red Flag" alerts for low engagement.
  * **Query Inbox:** Centralized place to answer student questions.

### 3.3 Institution Dashboard (The Admin Panel)

* **Key Modules:**
  * **User Management:**
    * Add/Invite Instructors.
    * Bulk Upload Students (CSV).
  * **Mapping Engine:**
    * Assign *Student A* to *Instructor X* for "Reading."
    * Assign *Student A* to *Instructor Y* for "Speaking."
  * **Analytics Overview:** Graphs showing daily active users, assessment averages, and course completion rates across the institution.

---

## 4. Technical Workflows & Use Cases

### 4.1 The "IELTS Coaching" Scenario

1. **Onboarding:** *City Coaching Center* signs up as an **Institution**.
2. **Setup:** They invite 5 Instructors and upload 100 Students.
3. **Mapping:** The Admin maps "Batch A" to "Instructor John" for English Speaking.
4. **Activity:**
    * Student logs in, sees "Speaking Course by John."
    * Student uses the **AI Speech Tool** to practice.
    * System generates a score (e.g., 7.5/10) and highlights mispronounced words.
5. **Feedback:** Instructor John sees the score in his dashboard and sends a specific comment: "Focus on your 'Th' sounds."
6. **Result:** Student improves via AI practice + Human guidance.

---



## 6. Future Roadmap (Post-MVP)

* **Gamification:** Leaderboards for institutions.
* **Live Classes:** Integrated Zoom/WebRTC within the platform.
* **Peer Learning:** Community discussion forums per course.
