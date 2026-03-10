# Manual Testing Guide

This document outlines the recent features implemented for the AI Study Mentor platform, ready for manual testing by the team.

## 1. Unified Login

* **Description:** A single, unified login portal for all user roles (Super Admin, Institute Owner, Institute Admin, Instructor, and Student).
* **Testing Steps:**
  * Navigate to the main login page (`/login`).
  * Test logging in with credentials for different roles to ensure they are seamlessly directed to their respective dashboards.
  * Verify that role-based routing and access control (RBAC) correctly restrict users to only their permitted areas.

## 2. Super Admin Portal

* **Description:** Centralized management portal for super administrators.
* **Testing Steps:**
  * Login with the superadmin account: `blinkgrid@gmail.com`.
  * **Users Page:** Navigate to "All Users". Verify that the page dynamically lists users from the database and that the data is accurate.
  * **Institutes Page:** Navigate to "Institutes". Verify that the page dynamically displays existing institutes.
  * Test creating a new institute and assigning an Institute Owner. Ensure the owner invitation flow works properly.

## 3. Institute Portal (Owner & Admin)

* **Description:** Dashboard for Institute Owners and Admins to manage their specific institute's operations.
* **Testing Steps:**
  * Login as an Institute Owner or Institute Admin. (Note: Only Owners can manage Admins).
  * **Manage Admins (Owner only):** Navigate to the new "Admins" tab. Test inviting a new Institute Admin and removing an existing one.
  * **Onboarding Users:** Test adding new Instructors and Students to the institute from their respective onboarding pages.
  * **Batch Allocation:**
    * Navigate to the "Batch Allocation" page.
    * Test creating, editing, and deleting a batch.
    * Click on a batch row to open the member management panel.
    * Assign instructors to the batch.
    * Enroll students into the batch.
    * Verify that these assignments are updated in real-time.

## 4. Instructor Portal

* **Description:** Dashboard for instructors to manage their assigned batches and view student progress.
* **Testing Steps:**
  * Login as an Instructor.
  * **My Batches:** Verify that the instructor can only see the batches they have been assigned to.
  * **Student Progress Analysis:**
    * Click on a batch to expand it and view the list of enrolled students.
    * Hover over a student row and click the newly designed "Analyze Progress" button.
    * Verify that the "Student Progress" modal opens smoothly.
    * **IELTS Reading Tab:** Check that dynamic line and area charts load properly based on the student's reading assessment history.
    * **Voice Lab & Speed Reading Tabs:** Verify the premium mock dashboards display correctly (glow effects, metric widgets, gradient banners).
