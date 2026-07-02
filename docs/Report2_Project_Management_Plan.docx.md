

![][image1]

**CAPSTONE PROJECT REPORT**  
**Japanese Learning Platform ManabiHub**

**Report 2 – Project Management Plan**

– Hanoi, May 2026 –

**Table of Contents**

[I. Record of Changes	3](#i-record-of-changes)

[II. Project Management Plan	4](#ii.-project-management-plan)

[1\. Overview	4](#1.-overview)

[1.1 Scope & Estimation	4](#1.1-scope-&-estimation)

[1.2 Project Objectives	11](#1.2-project-objectives)

[1.3 Project Risks	12](#1.3-project-risks)

[1.4 Probability \- Impact Matrix	13](#1.4-probability---impact-matrix)

[Probability / Impact	13](#heading)

[Low	13](#heading)

[Medium	13](#heading)

[High	13](#heading)

[High	13](#heading)

[R5	13](#heading)

[R1	13](#heading)

[Medium	14](#heading)

[R8	14](#heading)

[R2, R3, R4, R6, R7	14](#heading)

[Low	14](#heading)

[R9	14](#heading)

[Low	14](#heading)

[Medium	14](#heading)

[High	14](#high)

[2\. Management Approach	14](#2.-management-approach)

[2.1 Project Process	14](#2.1-project-process)

[2.2 Quality Management	14](#2.2-quality-management)

[2.2.1 Bug prevention	14](#2.2.1-bug-prevention)

[2.2.2 Bug evaluation process	15](#2.2.2-bug-evaluation-process)

[2.2.3 Component Testing (Unit Testing)	15](#2.2.3-component-testing-\(unit-testing\))

[2.2.4 Integration Testing	15](#2.2.4-integration-testing)

[2.2.5 System Testing	15](#2.2.5-system-testing)

[2.2.6 User Acceptance Testing (UAT)	15](#2.2.6-user-acceptance-testing-\(uat\))

[2.3 Training Plan	15](#2.3-training-plan)

[3\. Project Deliverables	16](#3.-project-deliverables)

[4\. Responsibility Assignments	17](#4.-responsibility-assignments)

[4.1 Team & Structures	17](#4.1-team-&-structures)

[4.2 Responsibility	19](#4.2-responsibility)

[5\. Project Communications	20](#5.-project-communications)

[6\. Configuration Management	20](#6.-configuration-management)

[6.1 Document Management	20](#6.1-document-management)

[6.2 Source Code Management	20](#6.2-source-code-management)

[6.3 Tools & Infrastructures	20](#6.3-tools-&-infrastructures)

# **I Record of Changes** {#i-record-of-changes}

| Date | A\*M, D | In charge | Change Description |
| ----- | ----- | ----- | ----- |
| 01/06/2026  | A | Pham Duc Long  | Add Information.  |
| 02/06/2026  | A | Dang Thu Huong  | Add Scope and Estimation  |
| 02/06/2026  | A | Dat Nguyen Xuan  | Add Project Objectives  |
| 02/06/2026  | A | Than Van Thanh  | Add Project Risks  |
| 03/06/2026  | A | Kieu Tuan Hung  | Add Management Approach Project Process  |
| 03/06/2026  | M | Pham Duc Long  | Update All Document  |
| 12/06/2026  | M | Pham Duc Long  | Revise Report 2 to align with the ManabiHub E-learning Marketplace scope, AI ecosystem, escrow model, and three-role actor structure.  |
| 13/06/2026  | M | Pham Duc Long  | Update WBS, deliverables, and responsibilities to align with the detailed 34-grouped-use-case SRS scope, including paired student, teacher, admin, AI, and finance flows.  |
| 13/06/2026  | M | Pham Duc Long  | Add Report 4, Report 5, Report 6, and Report 7 timing based on the SEP490 Student Guide milestone structure.  |
| 13/06/2026  | M | Pham Duc Long  | Updated SRS traceability wording to match revised Report 3 use-case names: Create Course, View Course Analytics, Save Course to Wishlist.  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

\*A \- Added M \- Modified D \- Deleted

# **II. Project Management Plan** {#ii.-project-management-plan}

## **1\. Overview** {#1.-overview}

### **1.1 Scope & Estimation** {#1.1-scope-&-estimation}

This Project Management Plan defines how the ManabiHub project will be planned, executed, monitored, and completed. ManabiHub is a specialized Japanese e-learning marketplace that connects Students and freelance Teachers through a zero-setup course selling infrastructure. The system focuses on interactive digital pedagogy, course-based AI learning support, AI-assisted Japanese writing practice, teacher KYC, final-test-based course completion, escrow-based payment settlement, refund governance, internal admin role separation, and risk-controlled marketplace operations.

* 1 man-day of team capacity on weekdays \= 4.5 working hours.  
* 1 man-day of team capacity on weekends \= 8 working hours.  
* Project duration \= 15 weeks, from 11/05/2026 to 17/08/2026.  
* Team size \= 5 members.  
* Total planned capacity \= 315 man-days.  
* Total estimated effort \= 315 man-days.

| \# | WBS Item | Complexity | Est. Effort (man-days) |
| :---: | ----- | :---: | :---: |
| **1** | **Project Management** |   | 50 |
| 1.1 | Project Initiating |   | 18 |
| 1.1.1 | Determine project idea, business model, actors, and marketplace scope | Complex | 8 |
| 1.1.2 | Analyze ManabiHub product background, AI value proposition, and financial operation constraints | Complex | 5 |
| 1.1.3 | Kick-off meeting and team alignment | Simple | 2 |
| 1.1.4 | Write Report 1: Project Introduction | Medium | 3 |
| 1.2 | Project Planning |   | 20 |
| 1.2.1 | Update Report 1 based on final product direction | Medium | 4 |
| 1.2.2 | Write Report 2: Project Management Plan | Complex | 5 |
| 1.2.3 | Create Work Breakdown Structure and iteration plan aligned with the detailed SRS use-case scope | Complex | 4 |
| 1.2.4 | Define project objectives, deliverables, communication plan, and quality plan | Medium | 3 |
| 1.2.5 | Meet supervisor and refine scope | Simple | 4 |
| 1.3 | Monitoring and Control |   | 12 |
| 1.3.1 | Track progress, effort, and iteration burndown | Medium | 4 |
| 1.3.2 | Manage requirement changes and issue log | Medium | 3 |
| 1.3.3 | Review risks related to AI cost, payment, copyright, financial operations, and schedule | Medium | 3 |
| 1.3.4 | Prepare weekly status reports | Simple | 2 |
| **2** | **Software Development** |   | 248 |
| 2.1 | Iteration 1 \- Foundation, Authentication, Roles, KYC, Notifications, and Configuration |   | 58 |
| 2.1.1 | Analysing |   | 9 |
| 2.1.1.1 | Analyze account, profile, notification, KYC, configuration, and internal admin RBAC requirements. | Complex | 4 |
| 2.1.1.2 | Define use-case traceability and permission matrix for Student, Teacher, System Admin, Course Manager, and Finance Manager. | Medium | 2 |
| 2.1.1.3 | Write Software Requirement Specification v0.1 | Complex | 3 |
| 2.1.2 | Designing |   | 10 |
| 2.1.2.1 | System architecture design | Medium | 2 |
| 2.1.2.2 | Database design for users, roles, audit logs, notifications, KYC, platform configuration, AI support price floor, AI usage logging, and wallet policies | Complex | 4 |
| 2.1.2.3 | Define screen flow and navigation by role | Medium | 2 |
| 2.1.2.4 | Prepare Report 4 baseline: architecture, database, screen flow, API contracts, and code-frame design for the week-5 design milestone | Medium | 2 |
| 2.1.3 | Coding |   | 33 |
| 2.1.3.1 | Public Google OAuth login for Student/Teacher, first-time account creation, role onboarding, separate Admin Portal username/password login for System Admin, Course Manager, and Finance Manager, hashed password verification, logout, and session handling. | Complex | 5 |
| 2.1.3.2 | Role-based dashboard routing for Student, Teacher, System Admin, Course Manager, and Finance Manager. | Complex | 2 |
| 2.1.3.3 | Role-based access control layout for Student, Teacher, System Admin, Course Manager, and Finance Manager. | Complex | 3 |
| 2.1.3.4 | Profile view and profile update | Medium | 3 |
| 2.1.3.5 | Notification list, notification read status, and common notification hooks | Medium | 2 |
| 2.1.3.6 | Internal admin account list, user details, role assignment, and account status management. | Medium | 4 |
| 2.1.3.7 | Teacher KYC submission, document upload, and KYC status view | Complex | 4 |
| 2.1.3.8 | Platform configuration for commission rate, course price floor, AI support price floor, refund window, escrow days, payout threshold, and AI guardrails | Complex | 4 |
| 2.1.3.9 | Audit log setup for sensitive operations | Complex | 3 |
| 2.1.3.10 | Common email template and system notification setup | Medium | 3 |
| 2.1.4 | Testing |   | 6 |
| 2.1.4.1 | Prepare Report 5 baseline: test strategy, test environment, test scope, and initial traceability matrix for the week-5 milestone | Medium | 2 |
| 2.1.4.2 | Execute unit tests for authentication, profile, notification, and RBAC | Complex | 2 |
| 2.1.4.3 | Execute integration tests for KYC, user management, and platform configuration | Medium | 1 |
| 2.1.4.4 | Fix bugs | Medium | 1 |
| 2.2 | Iteration 2 \- Teacher Course Builder, Lesson Blocks, Final Test, Validation, Review Submission, and Soft Delete |   | 52 |
| 2.2.1 | Analysing |   | 5 |
| 2.2.1.1 | Analyze teacher course draft, edit, archive, module, lesson-block, and publish-review workflow | Medium | 2 |
| 2.2.1.2 | Define validation rules for video length, title length, course introduction, and mandatory interaction blocks | Complex | 2 |
| 2.2.1.3 | Update SRS v0.2 | Simple | 1 |
| 2.2.2 | Designing |   | 7 |
| 2.2.2.1 | Database updates for courses, modules, lessons, content blocks, drafts, archive status, publish status, and soft-delete status | Complex | 3 |
| 2.2.2.2 | Design Modular Builder UI and teacher course-management flow | Medium | 2 |
| 2.2.2.3 | Update SDS v0.2 | Medium | 2 |
| 2.2.3 | Coding |   | 34 |
| 2.2.3.1 | Teacher course list and course dashboard | Simple | 2 |
| 2.2.3.2 | Create course draft | Medium | 3 |
| 2.2.3.3 | Edit course draft metadata and content | Medium | 3 |
| 2.2.3.4 | Delete/archive course draft and hide invalid drafts from publishing flow | Medium | 2 |
| 2.2.3.5 | Set course price with platform price-floor validation | Medium | 2 |
| 2.2.3.6 | Build, edit, reorder, and remove course modules/sections | Medium | 3 |
| 2.2.3.7 | Manage lesson blocks: video, quiz, flashcard, and writing assignment | Complex | 6 |
| 2.2.3.8 | Implement course auto-validation rules before publishing | Complex | 4 |
| 2.2.3.9 | Submit course for Course Manager review and track submission status | Medium | 3 |
| 2.2.3.10 | Publish/unpublish and soft-delete behavior for purchased versus non-purchased users | Complex | 4 |
| 2.2.3.11 | Teacher copyright declaration and digital agreement confirmation | Medium | 2 |
| 2.2.4 | Testing |   | 6 |
| 2.2.4.1 | Execute unit tests for Modular Builder and validation rules | Complex | 2 |
| 2.2.4.2 | Execute integration tests for draft, validation, submit-review, publish, and unpublish workflow | Medium | 1 |
| 2.2.4.3 | Test soft-delete behavior for purchased and non-purchased users | Complex | 2 |
| 2.2.4.4 | Fix bugs | Medium | 1 |
| 2.3 | Iteration 3 \- Student Marketplace, Wishlist, My Learning, Final Test, AI-supported Learning, AI Writing Assistance, and Motivation System.  |   | 55 |
| 2.3.1 | Analysing |   | 5 |
| 2.3.1.1 | Analyze student discovery, wishlist, learning, progress, AI chatbot, writing, feedback, and gamification journey | Complex | 2 |
| 2.3.1.2 | Define AI eligibility rules based on enrollment, course AI support price floor, writing block availability, and AI guardrails | Complex | 2 |
| 2.3.1.3 | Update SRS v0.3 | Simple | 1 |
| 2.3.2 | Designing |   | 7 |
| 2.3.2.1 | Database updates for wishlist, enrollment, lesson progress, quiz attempts, AI requests, writing submissions, feedback, streaks, and badges | Complex | 3 |
| 2.3.2.2 | Design marketplace, wishlist, My Learning, learning room, transcript context, AI panel, feedback, and interaction blocks | Complex | 2 |
| 2.3.2.3 | Update SDS v0.3 | Medium | 2 |
| 2.3.3 | Coding |   | 37 |
| 2.3.3.1 | Home page, course catalog, search, filter, and course detail page | Medium | 5 |
| 2.3.3.2 | Wishlist save, saved-course list, and remove-from-wishlist flow | Medium | 4 |
| 2.3.3.3 | My Learning course list and enrollment access control | Medium | 3 |
| 2.3.3.4 | Continue learning and video/lesson content rendering from last position | Medium | 4 |
| 2.3.3.5 | Learning progress tracking and completion percentage display | Complex | 4 |
| 2.3.3.6 | Quiz taking, flashcard review, and result display | Medium | 3 |
| 2.3.3.7 | Submit writing assignment and AI preliminary scoring based on JLPT rubric | Complex | 5 |
| 2.3.3.8 | View AI writing suggestions, highlighted issues, and revision guidance. | Medium | 2 |
| 2.3.3.9 | Context-aware AI chatbot prompt wrapper using current lesson transcript/context | Complex | 4 |
| 2.3.3.10 | AI support price floor validation , quota check, token consumption, and usage log | Complex | 2 |
| 2.3.3.11 | Gamification: streaks, badges, and automated reminder cronjob | Complex | 1 |
| 2.3.4 | Testing |   | 6 |
| 2.3.4.1 | Execute unit tests for wishlist, progress, quota, and interaction blocks | Complex | 2 |
| 2.3.4.2 | Execute integration tests for My Learning, AI chatbot, AI Writing Assistance, and feedback display. | Complex | 2 |
| 2.3.4.3 | Execute regression tests and fix bugs | Complex | 2 |
| 2.4 | Iteration 4 \- Commerce, Purchase History, Payment Webhook, Escrow, Refund Status, Wallet, Top-up, and Payout |   | 50 |
| 2.4.1 | Analysing |   | 5 |
| 2.4.1.1 | Analyze purchase, purchase history, checkout, payment confirmation, refund request/status, wallet, payout, and revenue-split workflow | Complex | 3 |
| 2.4.1.2 | Define ACID transaction requirements, idempotency, payout, and reconciliation rules | Complex | 1 |
| 2.4.1.3 | Update SRS v0.4 | Simple | 1 |
| 2.4.2 | Designing |   | 8 |
| 2.4.2.1 | Database updates for cart, order, purchase history, payment, escrow ledger, refund, refund status, wallet, withdrawal, payout, and reconciliation logs | Complex | 4 |
| 2.4.2.2 | Design checkout, purchase history, refund status, wallet, withdrawal, payout, and Finance Manager screens. | Medium | 2 |
| 2.4.2.3 | Update SDS v0.4 with transaction boundary, webhook flow, refund flow, payout flow, and reconciliation flow | Medium | 2 |
| 2.4.3 | Coding |   | 31 |
| 2.4.3.1 | Course purchase flow and checkout order creation (UC-08)  | Medium | 4 |
| 2.4.3.2 | Purchase history and order detail display for students(UC-09) | Medium | 2 |
| 2.4.3.3 | Payment gateway integration using server-to-server webhook and idempotency protection \[Technical Sub-task for UC-08\]  | Complex | 5 |
| 2.4.3.4 | Auto-enrollment after successful webhook confirmation\[Technical Sub-task\]  | Complex | 3 |
| 2.4.3.5 | Escrow ledger with Pending\_Clearing status and 14-day clearing job \[Technical Sub-task\]  | Complex | 4 |
| 2.4.3.6 | Refund request and auto-refund eligibility for purchase age within 14 days and learning progress not exceeding 20%(UC-18) | Complex | 3 |
| 2.4.3.7 | Refund request status and dispute status display \[Support UC-18\]  | Medium | 2 |
| 2.4.3.8 | Dispute request flow for non-eligible refund cases \[Support UC-18\]  | Complex | 2 |
| 2.4.3.9 | Revenue split, teacher wallet, and wallet transaction display \[Technical Sub-task\]  | Complex | 3 |
| 2.4.3.10 | Teacher withdrawal request and withdrawal status tracking(UC-27) | Medium | 2 |
| 2.4.3.11 | Shared My Wallet balance display for Student payment/refund balance and Teacher revenue balance (UC-17) | Complex | 1 |
| 2.4.4 | Testing |   | 6 |
| 2.4.4.1 | Execute unit tests for financial calculations, purchase history, refund eligibility, and wallet balance | Complex | 2 |
| 2.4.4.2 | Execute integration tests for payment webhook, enrollment, top-up, refund status, and withdrawal flow | Complex | 2 |
| 2.4.4.3 | Execute ACID rollback, idempotency, payout, and reconciliation test cases | Complex | 1 |
| 2.4.4.4 | Fix bugs | Medium | 1 |
| 2.5 | Iteration 5 \- Admin Portal Operations, Analytics, Reviews, Moderation, Reconciliation Alerts, and Reporting. |   | 23 |
| 2.5.1 | Analysing |   | 3 |
| 2.5.1.1 | Analyze Course Manager moderation/KYC/course approval, Finance Manager refund/payout, System Admin settings/role/audit, analytics, writing review, payout settlement, and dispute handling needs. | Medium | 2 |
| 2.5.1.2 | Update SRS v0.5 | Simple | 1 |
| 2.5.2 | Designing |   | 3 |
| 2.5.2.1 | Database updates for ratings, reports, disputes, moderation decisions, analytics, teacher official feedback, payout settlements, and admin portal dashboards. | Medium | 1 |
| 2.5.2.2 | Update SDS v0.5 | Medium | 2 |
| 2.5.3 | Coding |   | 13 |
| 2.5.3.1 | Admin dashboard for revenue, AI usage, pending disputes, reported courses, role-specific task queues, and reconciliation alerts. | Medium | 2 |
| 2.5.3.2 | Approve/reject teacher KYC and notify teacher result (UC-28)  | Medium | 2 |
| 2.5.3.3 | Review course submission and apply approve/reject/force-draft action (UC-29)  | Complex | 2 |
| 2.5.3.4 | Teacher course analytics and student-progress monitoring(UC-24)  | Medium | 2 |
| 2.5.3.5 | Teacher review of writing submissions and official feedback (UC-26). | Complex | 2 |
| 2.5.3.6 | Student rating, edit/delete own review, and report-violation permission checks(UC-19, UC-20)  | Medium | 1 |
| 2.5.3.7 | Moderate reported course, force-draft violation, ban teacher, and freeze teacher balance(UC-30)  | Complex | 1 |
| 2.5.3.8 | Run reconciliation, review reconciliation alerts, and execute payout settlement(UC-33)  | Complex | 1 |
| 2.5.4 | Testing |   | 4 |
| 2.5.4.1 | Execute unit tests for rating/report permission checks, analytics, writing override, and payout rules | Medium | 1 |
| 2.5.4.2 | Execute integration tests for moderation, KYC, reporting, reconciliation alerts, payout, and disputes | Complex | 2 |
| 2.5.4.3 | Fix bugs | Medium | 1 |
| 2.6 | Complete Software Iteration \- Full Package and Report 5 Finalization |   | 10 |
| 2.6.1 | Update SRS v1.0 and SDS v1.0 with full 34-grouped-use-case traceability | Medium | 2 |
| 2.6.2 | Complete Report 5: Test Documentation with final UT, IT, ST, defect list, and test report for the week-13 system-testing milestone | Complex | 2 |
| 2.6.3 | Execute full regression, system test, and UAT preparation | Complex | 3 |
| 2.6.4 | Fix remaining bugs and stabilize deployment | Complex | 2 |
| 2.6.5 | Prepare full software package and database scripts | Medium | 1 |
| **3** | **Transitioning \- User Guides and UAT** |   | 10 |
| 3.1 | Execute UAT with paired marketplace scenarios from SRS, including create/view/remove, request/status, submit/review, and payout flows | Medium | 2 |
| 3.2 | Prepare Report 6: Software User Guides for Student, Teacher, and System Admin for the week-14 transition milestone | Medium | 3 |
| 3.3 | Update Reports 1-5 and project schedule/tracking after transition feedback | Medium | 2 |
| 3.4 | Prepare thesis presentation and demo scenario | Complex | 3 |
| **4** | **Project Closing \- Final Report and Final Package** |   | 7 |
| 4.1 | Complete Report 7: Final Project Report for the week-15 final package milestone | Medium | 3 |
| 4.2 | Finalize final project products: database scripts, source codes, test documents, project schedule/tracking, and related files | Medium | 2 |
| 4.3 | Thesis presentation and project handover | Complex | 2 |
|   | **Total Estimated Effort (man-days)** |   | **315** |

**Total Estimated Effort (man-days): 315**

### **1.2 Project Objectives** {#1.2-project-objectives}

| \# | Objective | Description | Target | Notes |
| :---: | :---: | :---: | :---: | :---: |
| 1 | Effort Usage | Total effort must not exceed planned capacity. | \<= 315 person-days | Weekly tracking in task board |
| 2 | Timeliness | Project milestones are completed according to schedule. | \>= 90% milestones on time | Delay must be reported in weekly meeting |
| 3 | Requirement Completeness | Approved SRS requirements are implemented or explicitly deferred. | 100% for MVP scope | Traceable to SRS and test cases |
| 4 | Defect Rate | Defect density after system testing is controlled. | \<= 5 defects/MM | Critical and major defects prioritized |
| 5 | Critical Defects | No critical defect remains before UAT completion. | 0 open critical defects | Especially payment, enrollment, and access control |
| 6 | Transaction Integrity | Payment, refund, escrow, and wallet operations pass ACID and reconciliation tests. | 100% critical scenarios passed | Mandatory for marketplace reliability |
| 7 | AI Cost Control | AI requests are enabled only for enrolled courses that satisfy the configured AI support price floor and AI guardrail rules.  | 100% AI eligibility checks and usage logs passed  | Prevent AI cost overrun without exposing a separate AI token wallet to Students  |

**1.2.1 Timeliness**

| \# | Objectives |
| ----- | ----- |
| 1 | This project will be carried out in 15 weeks (about 3 and a half months), starting from 11/05/2026 to 17/08/2026. |

**1.2.2 Allocated Effort**

| Member | Weekdays | Weekends |
| :---: | :---: | :---: |
| Pham Duc Long | 7 | 14 |
| Dang Thu Huong | 7 | 14 |
| Than Van Thanh | 7 | 14 |
| Dat Nguyen Xuan | 7 | 14 |
| Kieu Tuan Hung | 7 | 14 |

#### 

### **1.3 Project Risks** {#1.3-project-risks}

| \# | Risk Description | Impact | Possibility | Response Plans |
| :---: | ----- | :---: | :---: | ----- |
| R1 | Requirement change: marketplace, AI, or financial requirements may change during implementation. | High | High | Freeze MVP scope per iteration. Record change requests, evaluate impact, and move non-critical items to the backlog. |
| R2 | AI API cost overrun or unstable AI response quality.  | High | Medium | Apply course-level AI eligibility, AI support price floor, request logging, prompt templates, AI guardrails, fallback messages, admin monitoring, and the ability to disable AI for unsafe or non-eligible courses. AI Writing Assistance must be presented as preliminary learning support only, not as official grading. |
| R3 | Payment webhook, escrow, refund, or wallet logic produces inconsistent financial data. | High | Medium | Use backend-only webhook confirmation, PostgreSQL transaction blocks, idempotency keys, rollback tests, and daily reconciliation logs. |
| R4 | Copyright/IP violation by teachers uploading unauthorized course content. | High | Medium | Require KYC, digital copyright agreement, report workflow, force-draft moderation, account ban, and balance freeze for severe cases. |
| R5 | The team lacks experience with AI integration, payment gateway, or transaction design. | Medium | High | Run focused training, assign technical spikes, build proof-of-concept modules early, and perform code review. |
| R6 | Schedule delay due to complex feature dependencies. | Medium | Medium | Break features into smaller tasks, monitor weekly burndown, prioritize MVP features, and reduce non-core enhancements. |
| R7 | Security or privacy issues involving KYC data, user accounts, or payment records. | High | Medium | Apply RBAC, secure file access, audit logs, least-privilege access, and sensitive data review. |
| R8 | Internal conflict or communication gap among team members. | Medium | Medium | Clarify roles, hold daily check-ins, use voting/escalation for disagreements, and document decisions. |
| R9 | Member absence or uneven workload distribution. | Medium | Low | Cross-train members, document tasks, maintain backup assignees, and redistribute tasks through weekly planning. |
| R10 | Misinterpretation of AI Writing Assistance as official grading. | High | Medium | The system explicitly defines AI writing output as non-authoritative suggestion only. AI suggestions are used for self-practice and revision guidance. Official feedback and final scoring remain the responsibility of the Teacher. UI labels, API response fields, documentation, and test cases must avoid wording such as AI grading, AI scoring, or final AI assessment. |
| R11 | Internal admin responsibilities are not clearly separated. | High | Medium | The Admin Portal uses role-based access control to separate System Admin, Course Manager, and Finance Manager responsibilities. Course Manager handles Teacher KYC, course approval, and violation moderation. Finance Manager handles refund, payout, and financial evidence checking. System Admin manages system settings and internal admin accounts. |

#### 

### **1.4 Probability \- Impact Matrix** {#1.4-probability---impact-matrix}

####  {#heading}

| Probability / Impact | Low | Medium | High |
| :---: | ----- | :---: | :---: |
| **High** | **R5** | **R1** |   |
| **Medium** | **R8** | **R2, R3, R4, R6, R7** |   |
| **Low** | **R9** |   |   |
|   | **Low** | **Medium** | **High** |

####  {#heading}

### 

## **2\. Management Approach** {#2.-management-approach}

### **2.1 Project Process** {#2.1-project-process}

The project follows an iterative and incremental software development approach. Each iteration includes analysis, design, coding, testing, documentation update, and review. The team prioritizes early implementation of high-risk components such as role-based access control, teacher KYC, admin role separation, payment webhook, escrow ledger, refund logic, payout settlement, AI usage logging, and AI suggestion boundaries.

This process is selected because ManabiHub contains multiple dependent domains: e-learning content management, marketplace commerce, financial operations, AI services, and risk management. Incremental releases allow the team to validate assumptions early and reduce the chance of late-stage redesign.  
1\.    Each iteration produces a demonstrable software increment so that the team and supervisor can review progress early.  
2\.    Continuous testing and integration help identify defects in authentication, admin RBAC, AI eligibility, payment, refund, payout, and enrollment modules before they spread to later features.  
3\.    The plan can be adjusted after each iteration based on real implementation complexity and supervisor feedback.  
4\.    Regular review meetings keep the team aligned on scope, schedule, risks, and technical decisions.  
5\.    Critical marketplace features are isolated and tested carefully before being integrated into the whole system.  
6\.    Breaking the project into smaller modules improves tracking, accountability, and defect management.

### **2.2 Quality Management** {#2.2-quality-management}

#### ***2.2.1 Bug prevention*** {#2.2.1-bug-prevention}

Bug prevention aims to reduce defects before they appear in the system. For ManabiHub, special attention is given to access control, financial transactions, AI suggestion boundaries, admin RBAC, and soft-delete behavior because defects in these areas can directly affect users, revenue, learning experience, or digital ownership rights.

* very requirement must be traceable from SRS to design, implementation, and test case.  
* Sensitive modules such as payment webhook, escrow, refund, wallet, KYC, internal admin role control, AI usage logging, and AI Writing Assistance eligibility must receive code review before merging.  
* Backend business rules must be enforced server-side, not only through the frontend UI.  
* Database transactions must be used for financial state changes to ensure ACID consistency.  
* Prompt templates and AI wrappers must log usage and handle invalid or empty AI responses gracefully.  
* AI-related UI and API outputs must clearly mark AI writing results as preliminary suggestions, not official grading.  
* Coding standards, branch naming rules, and pull request reviews are mandatory.

#### ***2.2.2 Bug evaluation process***  {#2.2.2-bug-evaluation-process}

The purpose of the bug evaluation process is to assess and manage software defects systematically, ensuring that issues are identified, categorized, and prioritized based on their impact on the system. This process allows teams to focus on fixing the most critical bugs first, ultimately improving software quality and ensuring a smooth user experience.

1\.   	Identify impact and severity: classify bugs as critical, major, minor, or trivial.

2\.   	Prioritize fixing: payment, enrollment, access control, data loss, and financial calculation defects must be handled first.

3\.   	Allocate resources: assign the bug to the most suitable member and define a deadline.

4\.   	Track status: record new, assigned, fixed, retested, reopened, or closed status in the defect board.

Verify resolution: testers retest the fix and perform regression testing when needed. 

#### ***2.2.3 Component Testing (Unit Testing)***  {#2.2.3-component-testing-(unit-testing)}

Unit testing verifies individual functions, services, and classes. Priority unit tests include price-floor validation, revenue-split calculation, refund eligibility, payout amount validation, AI usage logging, AI Writing Assistance availability checks, progress tracking, role permission checks, and course validation rules.

#### ***2.2.4 Integration Testing***  {#2.2.4-integration-testing}

Integration testing verifies that modules work together correctly. Key integration scenarios include payment webhook to enrollment, order to escrow ledger, refund to wallet adjustment, teacher publish request to Course Manager approval, Finance Manager payout settlement, System Admin role assignment, and AI chatbot/writing assistance to AI usage logs.

#### ***2.2.5 System Testing***  {#2.2.5-system-testing}

System testing evaluates the entire ManabiHub system against the approved requirements. Regression testing is executed to confirm that new features do not break existing authentication, learning, AI, payment, finance, or admin RBAC workflows.

#### ***2.2.6 User Acceptance Testing (UAT)***  {#2.2.6-user-acceptance-testing-(uat)}

UAT verifies that the system supports realistic marketplace scenarios. UAT includes teacher course creation and publication, student course purchase and learning, AI chatbot usage, AI writing suggestions, teacher official feedback, refund request, Course Manager course moderation, Finance Manager payout/refund handling, and teacher revenue tracking.

### **2.3 Training Plan** {#2.3-training-plan}

| Training Area | Participants | When, Duration | Waiver Criteria |
| :---: | ----- | :---: | :---: |
| Java Spring Boot | Project Team | 2 weeks | Mandatory |
| ReactJS & Tailwind CSS | Project Team | 2 weeks | Mandatory |
| PostgreSQL, ACID transaction, and data modeling | Back-end members | 1 week | Mandatory |
| Payment webhook, idempotency, and reconciliation concepts | Back-end members, Test Leader | 1 week | Mandatory |
| OpenAI/Gemini API usage, prompt wrapper, AI eligibility gate, AI guardrails, and AI usage logging | Project Team | 1 week | Mandatory |
| Git, GitHub flow, pull request, and code review | Project Team | 1 week | Mandatory |
| Testing, JUnit, integration testing, and defect logging | All Members | 1 week | Mandatory |
| Security basics: RBAC, KYC data handling, and audit log | Project Team | 1 week | Mandatory |

## **3\. Project Deliverables** {#3.-project-deliverables}

| \# | Deliverable | Due Date | Notes |
| :---: | :---: | :---: | ----- |
| 1 | Report 1: Project Introduction | 17/05/2026  | Project background, existing system analysis, business opportunity, product vision, scope, limitations, and major features.  |
| 2 | Report 2: Project Management Plan | 24/05/2026  | Project plan, WBS, estimation, objectives, risks, communication, configuration, and responsibility assignment. |
| 3 | Report 3: SRS | 14/06/2026  | Product overview, user requirements, system functional overview, SRS use-case baseline, updated Reports 1-2, and project schedule/tracking.  |
| 4 | Report 4: SDS | 21/06/2026 | Report 4 includes architecture, database, API, screen, transaction, and AI design. Report 5 includes test plan/test documentation baseline except detailed test cases and reports. Code frame and database script are prepared.  |
| 5 | Iteration 1 | 28/06/2026  | Workable source code and database script for foundation/account/RBAC/KYC/configuration modules; updated Reports 1-5; class/sequence diagrams; UT/IT test cases, defect list, and tracking update.  |
| 6 | Iteration 2 | 05/07/2026  | Course builder, module/lesson block management, validation, submit-review, publish/unpublish, soft-delete, and digital agreement increment with updated Reports 1-5.  |
| 7 | Iteration 3 | 26/07/2026  | Student marketplace, wishlist, My Learning, progress, quiz/flashcard, AI chatbot, AI writing, token balance, gamification, and reminders with updated Reports 1-5.  |
| 8 | Iteration 4 (Finance & Wallet)  | 09/08/2026  | Course purchase, Stripe webhook integration, Escrow 7-day ledger, and refund requests.  |
| 9 | Iteration 5 (Admin & Moderation)  | 16/08/2026  | Admin moderation queue, violation reports, payout execution, and teacher score override.  |
| 10 | Full Software Package & Report 5  | 23/08/2026 | Full ManabiHub source code, database scripts, final SRS updates, final SDS updates, ST/IT test reports, defect list, and full test documentation. |
| 11 | Report 6: Software User Guides  | 26/08/2026 | Installation guide, configuration guide, and user manuals for Student, Teacher, and System Admin. |
| 12 | Report 7: Final Project Report  | 30/07/2026 | Final project report, source code and related files, database scripts, test documents, defect list, project schedule/tracking, presentation file, and final demo package.  |

## **4\. Responsibility Assignments** {#4.-responsibility-assignments}

#### **4.1 Team & Structures**  {#4.1-team-&-structures}

| Position / Role | Member | Primary Responsibility | Backup / Support |
| :---: | :---: | :---: | :---: |
| **Supervisor** | Doan Thi Xuan | Provides academic supervision, milestone review, and feedback. |   |
| **Project Leader / Backend Developer** | Pham Duc Long | Coordinates planning, scope control, backend/API implementation, integration, and risk escalation. | Business Analyst, Frontend Developer |
| **Business Analyst** | Dang Thu Huong | Owns requirement analysis, SRS, use cases, business rules, screen authorization, and acceptance criteria. | Project Leader |
| **Frontend Developer** | Than Van Thanh | Implements public site, dashboards, learning screens, admin portal UI, and frontend integration. | UI/UX Designer |
| **UI/UX Designer** | Kieu Tuan Hung | Designs wireframes, screen flow, user journey, Visual Paradigm diagrams, and UI consistency. | Frontend Developer |
| **Tester** | Nguyen Xuan Dat | Prepares test cases, executes UT/IT/ST support, defect tracking, regression testing, and UAT evidence. | Business Analyst |

| Responsibility | LongPD HE171902 | HuongDT HE182134 | ThanhTV HE186362 | DatNX HE181631 | HungKT HE181698 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| Project Planning & Tracking | D | S | S | I | I |
| Prepare Project Introduction Document | D | S | R | I | S |
| Prepare Project Management Plan | D | S | S | R | I |
| Prepare SRS Document \- Marketplace and Actors | R | D | S | I | S |
| Prepare SRS Document \- AI, Payment, Refund, and Risk Rules | R | S | D | S | I |
| Prepare Software Design Document | S | R | S | D | S |
| Implement Foundation, Authentication, RBAC, Profile, Notification, KYC, and Configuration | R | S | D | S | I |
| Implement Teacher Course Builder, Draft/Edit/Archive, Validation, Review Submission, Publish/Unpublish, and Soft Delete | S | D | R | S | I |
| Implement Student Catalog, Wishlist, My Learning, Progress, Quiz/Flashcard, AI Chatbot, AI Writing, Token Balance, and Gamification | S | R | S | D | I |
| Implement Purchase, Purchase History, Payment, Escrow, Refund Status, Wallet, Withdrawal, Top-up, Reconciliation, and Payout | R | S | I | D | S |
| Implement Analytics, Student Progress, Writing Review/Override, Reviews, Reports, Admin Moderation, and Freeze Balance | S | R | D | S | I |
| Prepare Test Documentation and Execute Testing | I | S | R | S | D |
| Software User Guides Documentation | S | R | I | S | D |
| Final Project Report and Presentation | R | S | I | S | D |

D\~Do; R\~Review; S\~Support; I\~Informed; \<blank\> \- Omitted

#### **4.2 Responsibility** {#4.2-responsibility}

#### 

| Role PDF | Responsibility PDF |
| :---: | ----- |
| **Project Manager** | Plans schedule, coordinates communication, tracks progress, manages risks, and keeps the team focused on project goals. |
| **Analysis Leader** | Leads requirements analysis, defines scope, maintains use cases, and prepares SRS documents. |
| **Analysis Member** | Participates in requirement analysis and validates user stories for Student, Teacher, and Admin. |
| **Design Leader** | Defines system architecture, database design, transaction flow, screen flow, and API contracts. |
| **Design Member** | Supports interface design, database design, and technical documentation. |
| **Technical Leader** | Chooses technology stack, reviews implementation quality, manages integration risks, and supports complex modules. |
| **Developer** | Implements features, fixes bugs, writes unit tests, and maintains source code. |
| **Test Leader** | Plans tests, manages test environments, writes test cases, executes tests, summarizes defects, and reports test status. |
| **Test Member** | Executes test cases, records defects, performs retesting, and supports regression testing. |

## 

## 

## 

## **5\. Project Communications** {#5.-project-communications}

| Communication Item | Who / Target | Purpose | When, Frequency | Type, Tool, Method(s) |
| :---: | ----- | :---: | :---: | :---: |
| Daily Meeting | Project Team | Discuss problems, report progress, and update blockers. | Daily | Online: Google Meet, Zalo, Discord |
| Weekly Meeting with Supervisor | Project Team, Supervisor | Report project status, confirm scope, and receive feedback. | Weekly | Face-to-face or Online: Google Meet, Zalo |
| Iteration Review | Project Team, Supervisor | Demonstrate completed increment and confirm next iteration priorities. | End of each iteration | Meeting, demo, GitHub task board |
| Unscheduled Meeting | Project Team | Discuss and solve urgent or unexpected problems. | When issues are found | Online: Google Meet, Zalo |

## **6\. Configuration Management** {#6.-configuration-management}

### **6.1 Document Management** {#6.1-document-management}

* Project documents are managed using Microsoft Office, Google Docs, Google Sheets, and Google Drive.  
* Each report version must include a clear file name, version number, date, and responsible person.  
* Final submitted documents must be exported to PDF when required by the supervisor.

### **6.2 Source Code Management** {#6.2-source-code-management}

* Git and GitHub are used to track source code changes and support collaboration.  
* The main branch contains stable release-ready code.  
* The develop branch is used to integrate completed features before release.  
* Feature branches are created for individual tasks or modules.  
* Hotfix branches are used for urgent fixes that must be applied quickly.  
* Pull requests, code review, and successful tests are required before merging into develop or main.

### **6.3 Tools & Infrastructures** {#6.3-tools-&-infrastructures}

| Category | Tools / Infrastructure |
| :---: | ----- |
| Technology | Java Spring Boot (Back-end), ReactJS, HTML, CSS, JavaScript, Tailwind CSS (Front-end) |
| Database | PostgreSQL for transactional data; Redis or scheduled jobs for quota/reminder support if needed |
| AI Services | OpenAI API or Google Gemini API through server-side prompt wrapper, usage log, and quota control |
| Payment | Webhook-enabled payment gateway/sandbox for checkout confirmation, refund flow, and reconciliation testing |
| Storage | Cloudinary, Amazon S3, or compatible object storage for videos, teacher KYC files, and learning materials |
| IDEs/Editors | Visual Studio Code, IntelliJ IDEA |
| Diagramming | Visual Paradigm, Draw.io |
| Documentation | Microsoft Office, Google Docs, Google Sheets, Google Slides |
| Version Control | GitHub for source code, Google Drive for documents |
| Deployment Server | Docker, Amazon Web Services or equivalent cloud/VPS environment |
| Project Management | GitHub Issues/Projects, Jira, Notion, ProjectLibre |
| Testing | JUnit, Postman, browser dev tools, GitHub issue tracker for defect management |

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARwAAABXCAYAAADWHPr7AABJoUlEQVR4Xu1dB1hVx7Y2t+Smm96MsQs2wILYewELShF7iT3RWOi99y4ovSMi9i6Iio1eBWwYG5oYS/ScXU6hnHmz5rCPh31A8Sa5ee/d/X/f+tCzZ9aePeWftdbM7N2pk4D/FXi83/srecI6P7Gdjoy27IXEW3t3WOQ2fdBz64F19Vkhb/P1ChAgQEArSPa6zpN4jb3ZYN0bUVtfj2woLDIbLSQOM9+LEHqDr1uAAAECVGD3expTzsNFTdY9NMikI0JjkVj3RbJMO3u+bgECBAhQgc3doU+7j7jXbN1Tg0g6KrRlb8Ra9UFM8o+GfP0CBAgQQIDdn7/TvlMTkaP2a7tR6sJiwhHb64lFvtN68+8hQIAAAQTi/W4jRK4jH8st/z1XihO5ZU9EBxnni6/mfsK/hwABAv4fAYK0YKm8hvyDC+xSvtMdkIO2BoG8rjTbYMKJXBQDuvnl46ON8rxMVGUVIEDAX4T95+9+NXTD/qnzfU9vnO97KsLEOzvB1Dsn7lVi4nUq0TK+0KXuqeID0MMEzwlFtv++K8UJsu+LaN8pG/nlBGDCeGvzpbUjXcvtl/qXefh7ljkneJc6x71SKhyTEq5E2TxRPHmfr1OAAAH/AcDgNXY+vkxv44GiTxbsQu+Z78SS3mF5a94eNNry0HHQg9Cdt9gw86NNVv9+sBiE2doTsc5D5UzIbI2A8Y7qkPGYbLIWnTJRmJ0zQmZnOi7zCo3QpovrduOyvsnXK0CAgD8ZCoXi/ZFbD8V/vSSz+R0zTDSmyeh906TXkvfm70F9V+32AX3STLvuYs/xd6WWv49wIP5D+Uy+Kas40V+9vC5FthtXn1/02PyCETLJmYZMTk5/LVlwyRitOD3fUV2nAAEC/gMw3HbiX6O2Hoj9aEEmesc0VYNIOiLvmiSjLkszFKOtDy0DnZSP0WjGWlsBS9p8EnkdUdj0RJT3pBxsibwHeiHm4lPqumrZmXky07OaRNIRmYsJCudv8Ci2n9e6JgQIEPCnw9z71JaPF2ZiqyZFg0g6Km+bpCKt1bt/iTtVNwJ0simb18nJrmJNEnkdQQ5aSOw4JIora9zlbSNWnl/0xOSMJpF0WE5PQ2vylt4teVwy+EUtCBAg4E/Htv2Xv+mzevedd83SNEjkdeQd8wzUe2VmMbZAOoNeJm5NrMy6z+8iHBK/cdJT0NsXbAKdEG+xK9icZHbeUJNEXkPMzxuhFWfmXeKsJgECBPyHsDz4rG1ni3QSs3nPJAn9yzgBvTk7vsPyztxEQjidF+xGXy/ZuRd0oti1/6Q8x5UC4Yg390TiH7/tuGx+sWdHBvEf5+HPGgsypoDe+OqooQtz5khMTxmiOSemolnHJ3VYjE9MURHOgguz0ZLTZhmta0KAAAF/KvAM/89B3+/J62wBQWIgm3jUZclO9O3yDNR12cvlWyzdcLrPFqRhdyoZfbFop8LI5bg76JVk7+gqtur7m8wKE4e1NqIchyDKaRj+O7R9cVKKeEsvLMpAc5N1LySy061DiPkS9CZejV5odsoIzc2ehkxPGqGlp807JMtOz0MW2bMI8ZjkTEcLc+coPMucHVpVhgABAv5cnCi5M/iLRWlPwJ3624w4ZOyRjXLK76O8yz+jM1Uvl7M4zcUrD9G6iAvoDcN49PWiNDb0wOU5oFeWGzdLbDNAym78GrGJ61Dj9Yuo8UY+/nupfbmhFOmxYCS27ENIp8lOC4ntB+dx5Q2v9ncxPzUDmWQbop03klHVk3IsFS1/25fLT6vQqfoTaMXZ+Wh2ziS08NRc5uidgzNe1IQAAQL+dNjGFyzvsjRd/saMBKS/6QC6+bMYvS7WbTuP3piRiD6Zn/rw4q1n34JeJnmjC203QEGt+wTJz6fys7wcTQ2IjV+NqI1dkNSuP2J2LN7GlfeH8yuPmp+ZgeZit6jqaQU/5yux96ddaFbORGSePeOXkgc1XV/UhAABAv50DNu83++jBRkkfpOSe50/PttFY1Mzqrr1FK0KO4c6myWTTX/dV2SWuiH0N9Ardh+1t8muLxJv6o4aLsOKdgegUKj+KTsdg5gfvkBim/5N0sOBK0AnQs86W+TMuml+1gjNxq6RVf4G9Ez2VE0BVoFe6GgLZY+L0YK8OWhJrlmxG3IjZRUgQMB/CF8t2rn3b8Y70Vibw0jEyMmgfPScRa7ppcgptQQ5p5VqiPvOMvRj9CXUbfku9PeZcejtuYnoQ4t0NMcjOxZ0KhSKtyl73TLF1q6IchuFmu5dJnoVMhbJ8zOR9KA3kh4JaC37PbBbdUFFDLLsCMRu/AqJrPpK5NkRuqD33M+nxy7ONfnNNHc6mntiGgkaB1R4op11SSj5eizafTMdSRolJD/VQKE9P+1ESddiUOr1BCK76lJRQKUnmn/GGLkW2pGyChAg4D8EPC4/7bd2T2Eno2Q03y9XNdjPVD5AnSbtQJ0mY5ka3VqmRKFO06KxCxWL3p6TQALN72PrqLN5KtoSlb8W9DZcuziUch15X77xC8SEmaFm8a9Eb9Pj24SAnn/3LhKt/eSFrOqMRN9/iRqK4GV+mJiwSyXJtEfSTV2Q2HHo7edhyz8Evf4VHpsWn57bBJv2uNWmGcfGo+lHx6JJh4ejNXlLkKxRRnTUPK1CZtmGaPLhEeS6UsagGScmIAg676gOX9+6NjTxDKHOIDH5Dya7nbxj6pl9Z65H9i2z0PP3J+3Zg/7OT98R1CkU/0qteDw+/OLPxPUE4OK+lVj485gTl59+o56Wj5yqh59PjqoMMk+vnsm/9kdjVeYN06HhxYG3bj0jWxwECPjdSM+9rq+9JvPB32cnI6eUEo5v0M6zdehjixT0+cJU9OWitFby9eJ09NkC3k5ksxTiVs10yx4Oepnk9Uspp2ENzPpPEJu8ETNIM9HbVF+NKFcDRNn0R5SdjkogQEwHG6PmZw9IOoWURuz2RUi2uStiIuYfwI7QP0HvslzzhAUXjDX21Mw9OY2sPoVU+alcquz6Y8g826jVUjiIaY4hMsW/u5U5ks2JL8PBa0+GgoyOLLvSL7DskU5Q8X2dkPJfJmyvOGOeVd/ue5Vra9GbVkfqvrM+ctMyr/ZRq30+h6t//WJ24uXS3t75K7nfWIWiy9jI8guWh28sVE/LR0JJ/UCD8NJHpsnVoehPPuE+MaoyYUBg0a/1T9kuWVUPe6zff83D//Stqfx0AgR0GONtj5p/uWRnU+d5qSgdkwyH+09osvqUf1VTKn56giIO1xDr5l0T5f6bd01TUb/VWXcWBJz6GvSKXYZ7I8d+SPz9F0h62E+lVyERo8afilHjrZLWcrMQNf18TZWu6ddbZHm8wbI7kiRvcAWd+Od3Vp5ZcM7svFG7hLP/VpZKRyJ2pWYen0Bcr1aEc2o6Wnlm4X23IreXWhOA5NK7o0H6BRY9MEu7sinkbP14bOFMDcm781KygjNp47eXXZ4RW5nNv5Ze+vgrTGC3P3A4v4H7DTuB3w4IKKpZu6f2O/W0fNzBltDVB+K+edd//pR/7Y/G8+fow5uPRORlZ1uP1C0aGlIsDz57azE/nQABHUbvVbts3zLPRN8s3YnKbz5WDdZXIfJIDYndvNdCOO+YpqNpTscP1dUp/oUv/53ynpSFrLsRy0VekMnP/kpIjwYiatO3qMGmD6JC55Jl9rwHeXprzy29O/eM5iFNjnDKH7+w0nzKXNG0o6M10sJxCPuCLSeuPbn2yldSJJU8GAUyMKjo1qQd5Trq12LLfv50dFjpug+dL7p86HzJbQT+NxANXLNIv7y6p1/Rkz7+JT/19CmwPVL28ztcvj21j74ct738+keO51UunUSh6DoosKhi9e7axbjo/5gWVW72qWuhy+euF5wMoytW1TyQkNU0t7zrn46NrFj+hVthd+2AgtX6ocUWqCVIDxgTWTarj0++VSc39LenTxUfDA8v3fiBa4mbXnDxapyOWIlhZ25r9fK6ZPmxa77LJ84X7C49efI+trC+HhRcsvk9tzJX3cCidTjte1r++dN7eRcti7h4X3dURGlWF6/CpgGhFYfH76icOzSkdNmggCKVNQZlGBdVsWh0ZOlyXAfvcr8LEKACdOxxtofj3zBOR/3XZSGKVQaMX4aGpmYUsr+KENTbc5RkQywc811oquNRD9CrqK/sQvsbVTRu/hpRzvrYeiniq2kXigYpkp0Mh5UpxG7pjiiX4SImwoIEjK0KfrRYetasVfyGE3CbFubORffpe0SPWC5G1vkbkeGxsRpp4RUWTkXW/qgDLok64Zgk1eirX5uVeNmoa1ANwoTSPDCw+LmWX2GDXkjpGesDNb0WptUkfuZegL70KEQ6gcXXiq+KVW8pfBnhrNl9zSz3hqinfljZ/Z4+hYrBIcWP9cOKn+gGFZXaHP2pD7hUIyPKnvXxK5o5Oar84OCQkl9yrj/vAToKb/36xfCwkhvDw0uughs3N6nGuX9gERoYUvZM27+QnhZbEY3J4IM1WVddugVWo76+hYoxkRWFdkdvThgeVpo/MLCI1g4slWLSqsLpPtH2yz/cwzv/t51lD1dgwrrX2aUAdfMtQbMTq7y0/Qrze3jlPwN9cG/73Aef9PTOVwwMKIblyLe45xIgQIW6X6jPxloduvC32Slotls2UrQsSbPSBuSSVoo27LiENsfkq8QqrhAZu2ej902S0D9nxbeK4XyyKBP1XZs1H/RKYleMYlxHipkNXyHaZzJqFj8iepupp0iy3wNJspyQZK8LT1yRZJ8bYrYvQeJN3cjxhgarHvBK0UK6uvAL0Lvm/FIXi0szNQgEZObxici2YBN6LntG7nVTdAOtyVtMfuennX9hNhzaXNq6NtrGrqqHBiB4MN4bFVl5xjixJmNmQvWewzW/jR4XWW78od9V1C+gYP2S/VWfjwgvX/9NQDUyTa5xyrsp6j0ktPja2Iiyc9vzf+mG1KyQlxHO2r1XTXeV/6qjE1T85GPni6ZL9v/0uUfOT6P7BRT+YhRfEbar8uGAkRGld752yx/1XUb1lF4BZWhSbOVc0DErsWL8t36lyDy52gq7QD/oBRXWWuysGT1ve957hrFVY/RDS56bp1V/tyyjJrh/QNEzq4PXZqfXPf3APK3m+67BV9DwkOJ5Y6IufuR15jaU940BgYV7ennn//qUVXyzIK16EyYt6ZqsK9Zbs+rxXHPZXdu/iPE/d98I7u144tbsPj4FTXMTa77nnkmAgFaY5Zat3eu7zCf/NE5CDslw3lKJ/Cu/ok/np5JVqH/Njn8hLeeruHNTqgObJilIa03m043RBSRgLHKfsFhhr4XEP3yFmG3zVHohdkOOLGzoonl2SiVdVeeoELxSNMg4GWf9G5Z/2hRuzjLN0yQbELBkIi4HocbmRnKvSw8voHnZM5Hx8dYBY7COvju7gPIpcxnLr4+2wBFO/4DC+l7+ZRUDAktO9w8uO+dx4qfJ06KqZn2MCae3XwF5vQXM9nhQF2Fyqjh8/WGPkdtKyydHVcKLyIgrw+FVhLO75OFAbFE86mR5ZhRcw3o/1gkqqtYLKsreUXhfZ1RE2Z1O1rkjAw5de18XpzMILw+EOjKMq7T71r+icfnO66Pnp18J1fLNP4F/f+/6w+c9Vmddt+jmXSg3Trqcvm7vtSidoMKHCcW/DAP9i3fVGvcMKEcD/IuCUcuhWwC26vb19il4BNbOd7uvLhsYUCRxzL5JXjsSU3jfoLtXfgO2jILh/5OjK+Oxhfcgr14qvOBeQNsYuWnvZDy9YdcoiaxKcQjefxmTSKJyyRtbM61EfWWqRd423YmGbtpf8NND+nPQS+9Y5kc+B4MJRJJpp9LbUHZYeSBzU4+Ws1JtiOqUeC8EX3kQuRiQb1DtvLKz24bzq66b5Gq6UyBTjoxCB9QCxgdu7UHTj4whsZ1WhHNmGtp4YU3lHemd7q0qox2oXKrAwts2B2+MRcr3HxOXYXhY2dxPAq4B4SyC/8Pvw8JLs/v4FlxPLX7Q1yC8tHLijopsxDuNzhFOZ8eLZAsBAA/qbzCplLciHKu8CS3XvsJkVDMosFBFOH+3yyXXhoWWxGE36nJmzYOuBhGl5wzCSsp+oRSfYYvEu6tX4RP98NLCoaGlt0duK3swant5lWfu7bXLd12JxPoehV64Oxp0BFU9fHf0tpLkHtg91A2rLJ0YVU7KhUk2q4VwPlu668rKAZhwLI9cXw3XalHtmz19C2738S08B9e7eedXYffttPJpBAhoA8uCTm982zSN7DAuv/lENViXBp1FbxjFaBBLe/KuxW7UZ/XudJz1DYWi/m122/zjcsvuhDjkeQkqvSQ2A9ZLy6HMlwm7tSdinPXlbNRyMyjrjxdXj1hw2rjJJFuTbGDzH8RwCh6+2DSYcDUaTTk8UiMtvBlw7bnlsNmnldXRHtRjOGMjLw9RvzayhXB6+uaT4CkeeP/Cg/9UP7+C65lVj1sIpxysDFXAGLD/6uOvxm4v/6mLW2vCwRZM5UsJJ6joJEc4nR0uTIZrM+Mumw8ILBYbxVUs+9L9UiN2lcgREPPU6vDevoX3sHvlOiSk2KSb57nBMefvfoXL8qZZyuUIneCipxzhAGbFlr2jE141Zmh4xRGtgJKmqTGV0wYGFCbwCcfq8PVVXB6TxMuRYPlFX6q31fIvvPVd1tWt3DUBAloBd7y/mftkx/7LJBVpr92D7j9hVIN1hutJ1Gl6xwgHLJ7PluxG/dfvdQG9bOSCr8WuBg8kW7uTE+IN184plWJXhwmZi0TgTrVBMHxpgE/KeIy7I68+TVaG/Mo915qdNUJtEc6s4xPRqrOLUN3zF8cywi4HoGnYwuGnXXjRGC07beHXujbaR6tVquhK4jJy4AhnSHixCfy/7t6jXv2DS++OjSzbVfvzs2/1w0qqJ24vP4t4X5k4Vn3vI0waJQOCy4CMSGzH7kjd7F5+xbKNB16PcO4+Zr4aEFhUOjG6PLuvXyFjllJLyM88pSa6r1/+Oe6e6jBNak04XBkACZdua33kW4O6exf6jAwvjYcYDhDO4oya1ZjYJAGnrqtiX/NTLht197okmbCjogZbdXfdcm/15a4JENAKbsl5b+n+sK/gH8ZJyMz7FGpWKJCsoQlFHK5FXZako7ewO8Unl7YE4jfdl2ewDkklpqCXTf5xhAg28W3uhiiHwahZ8hyhRhmSHg1AYqu+rd5z8zJR2GD3ytkATJZ3sLwBX1iAl57zCQTE8OhY5FhkiWRNUvwcTWTD3/IzFhob/iB+s/SMeUNQhddyfn20h8TCe2NABgQV3x8fVdZq782obRVzPvauQl0980+873DOs4dv6RntoHJ2894bBniQvj96e3n5N77l7MDA4sAc7Lao512ws3p9d/9y9LV38S7I+41PSaVOWGW1ffbN3tEX7+ti90rUyerMJEiLdX2NXbobA7HLEl10X3fEttJfPnA4p9qANyy0OLJPUIVc27+o7uKNX3vCb+v3Xhk7JqK0bFB4ZerXHpf8v/EuCpkeWxGWVf6ot0lyZQgmLzrg3C0Sx1q0s1ZvcFhlCraQ/LQCy/Z39SttnhFfuUQ3sDitp3f+c3z/z7ccqluMSUUxMOLK2Z6eheSE/cpD177GxHjzQ88KNG5Hxcl5e/b8WzuvBfwX4IfteV9+bJHy+B+zk9CKkDx04NJtZOKZ0/I+nAT0gZkmubQl75rBgc2MO9V3KG3Qy2a5f89YaRHCoX0moYbas0iSvlUZEN4EblYfDXLhC3ydEzn0g/fjpIFOtzy3t9acXVJpdrp9wvEodUClj4qQX7k7Mj1pSPbkwN9WaU9PB+vmYcmTklbL2y/D3upfdUBMky8fWL3rygD1a0A4H3mUIS3/okejIsvujN1ReXLN7ivkJWFgNazAbsiYmNoqg20llwpqRR+r58WD+F2TpKq4YeFld4eHl94Zs6OqyuHYzYlwLaHkgZZ5yuXsQaGlxIXDuj41TaraZZJcHZ5V+6j30p21B0dFlpOAL2DbuTsTJydcKZ4UVREB5Mz97pRze9yYqOrz+mHF9fg+d2YlVp1PLX7c1+pI3XrT1Ms5KYW/EutxZcbVkSMjK67rh5feHh5RXofvDTs13zJOuOxplFB5Eps4X2y7UPeZYXxl6vDtl+unRJc7tZTr77PiKxM7+9SgZZlXhNUpAe0j7GDlhI/npUhhh/AXC9PQZ/NTybtwIFDMJ5WXyXvzduG8KfCOCBITYXcsjZfatHzS17qf8tgC7w1+rxIG56XtdRSS2DW2oDPrZlZvs5MzRGa5bb9SFALD83Nmo4Wn5pBzVbOPT9ZIAzLv3Ay0JNe8FAZ769poH3nYHQKB5eO8vLxWrhFxqfyvIt2Q4jUZ1aKPIH6lfh2QVVD7cWzZs87qRMDhzh30VmTu1U+iLt776GDlHXJWDAADeQ/O45andMWAvNKL6j7YU/vovT3k2q3OeS3XWq6/AfnVNxeqXXsnpKD+45Ds2o9P4GcAXVkF9W+Dfk4HPN/ByucfQjnicXnh/vD7njx8P5wO7tmi6y2fExWfQX7u/4axlXu6+xQ1WKTVkL1SAgS0ia2xRRs/W5DaDC9Mh2VucKHaWoF6lcAXHvQ27N0NOqHji52Gljba9lWSB6w6wZ6aVqtPrxbySRl7PaoxL418gyrzeup8i5OzGk1OaZIIJxA4BqLhr0qpJHs6mn96NvIsdVTFb2zjC/t9ZJa8vv+63YvT8+peecyBD4OwEtOPgm6i7r6FZP/RfxuWptZ+28ev+LexkWW5154IHxIU8BKMtTwU+wl5B44miXRUgKywdSN3Si0hboTklyvdxNb9f4avNPBJ5HUE8ous+z1QPL77Feh1L7ULArJoK2DcUYHXWZhnz5QeubufuCkR+6q1Z7lmH5tsf/TMksDTafbJxT4ZeXeIW9hRGMZXzNAKqWocua3UnH/tvwHfZdSOGRBUIp8cVUFebi9AQLv4fEHq+Q8sMjVIpKMCe3I6z89EE+2OwEEpssohOxNrLHIYzEh+50fvGmy1EOU6ooAr66Jck9MW59veYdwRIS5X3ixkX7g5gXvhln1CydIVwedWJuZc3RB2oMphS0z+2nneOWSlraP4YU/te5PCL+gsTq8j2/v/2+Cfe6vz7LjKAfNwPfCvCRCgwlOW/abr0ozr75rt1CCSjgiQzQcWu5D22qxah4T8gZxeZvsiZ4mDDqIhftMGkXREIPYjtdFCTMxK8g2qp+zTLktzza6b5bUdv3mVANnMuzgDbTi/svBE3X6V2+SQXmzhs6tcx3dPhUPw/mqXdZEXJwzffCCp+p7oIy6NAAEC/gDEHLkyuceKjN/go3XgUnVMkom8a5ZKPgUzaP3eylXhyj0yHCinwRnkg3VtEElHBciKse6LpPs9yY7WrJu7DJefthDPbWeHcZsCrlcOFuxGzT83C/2Yv7rIu9hRT72sTjtL5jsmXBrmmVGyNjHnmvmayPNDhm85mHmp7lEv9XQCBAj4nZjjnv1jt5V7sZWSgT6av7ND8vH8NPThvFRFz5WZD4w9Tnlujs7rrq4Tu1Uf0u6j8uGTvHwSeR1h4JPAln0Qm7CSLPtuvrDOaUWhBZqXNxNZnJ3VMcmdhcxzZigW5s4RORfZ+h29cbSLelkByaeujgg9ULvcPvFiT8eUyi4+WRXmcz1zIsp+1lzpESBAwO/AFKdjC8daHzk6cuvBrFfKloN7JtgeTVsRctbTPq1ssVNKaZsWQEP5oWFiz3H35bBDuA0i6ahIrLA75j66nolZQwLGjsWWq7deWn8MS9arZMvFdXssL/2QGVDu5Zt0PX5+bHVEu0FgWPqNPFwza33UhU1bYwvW/bD9or1bRgnZNCdAgID/5RCFmCyQOg1phM/y8knkdQQOfdIRC9Jgjwf/Hn8GYHessENWgID/Y6DcR7sg+5b9N/+m0JispI46iI1cSA5sChAgQIAG4JQ0E2qS8XvjN/D+G7Hv9Eq2skAj5iJAgAABBIrLJ76hAowq5Vb/fvxGZtULSRx1pXTUCvJuGQECBAhoE4z39CG042AJY/n6+28oLHJMNnK7fojZvtiRr1uAAAECWoGOXLig2aaX8tBlBwQCy7AbucG6F4JzV4zzsKeiqGXOqIMvxRIgQMB/KeDApiRtUxhyGYQaHQehhlcIpGEddeFrmrTUSfce7TvtAHs8RvWqBQECBAhoF3COSrLL1kLsN82X9jfyeLVM82K2L7SR5W6bI3twtS8QFl+nAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAF/JRQ3z3eV5UbNkp2JnyE7mzBTIapt9S0kAQIECPjDwNQWf8mEzj0tdR4ik7kMFTMpPzjz0wgQIEBAh4Hu3PlQer2oh7jiVB/FtUsa3wKiEteOoR30niK77kjsMvKmoja7lZUD55XYuqJvZDg/e6Ogi7DTV4AAAe1CutdtPRtsfLkx1OgaFWrS5veQ6Cyn+TLnwbTMVgsx+9xWqF9T3M7vxsStOtgUNP0aE2S85z/1Zj0BAgT8HwQbt9a72aEfQk49kciu/wb+dQBYLdSO5a7IYzCiXA1K0J08Fakorp3Ror0n3kb2XZHYWvva63z2VoAAAf9loOPW+MntByDk0BuJbAb8wL+uDtpjbJTYefh5ecHOQdxvihun+tHek+6Ay0VZ96vGhKPxPWwBAgQIIJAd8JxFu4+6J3fSbXjuY9imS8UB4jVY3lT/TVGV8zkTsSBT7jigiXLVP8t9NfM/BbC+4JWk/HIJ+GsBfQXahf/7vwNoW5A/St//WUgzHVa9tmQ5rGH2uS+V/1QyUHYkyIjKsP1eI01bgvPJj4XMw5X+iXoZ2JztBmw7OuB3yZnt4yCd4lDk1+xuh3XMbrvV3HUmy3ml9IDP95Sz/j2x18R78sozA9R1k3wKxQfStE2rKNeRh1nXETkSV4OjdLi5h+Lh3R5cGvZ4iJnIdWQjHbfaAwhHdjhglnqZqF22a6T73NbKzyWpLCNAw35ffXaXwwZ+uZV57Nc3nouZiPVpfAFBWnOml+SQ3zI62NgXl/0Y7T4yB8pG+0xOkufvHqhg2a8lB7yWS/F9cTnWybIjZynq6l7ZWeFesoMes9urz1aC20Oyz3ORor7+lVsFwOqT7HWzgPrX0NOOQBmYg74z1J9fftRPt9362mm/Xnpmx7SXES8qO6LNZLmuYqA9+Pnx/agsFxNIxx7bNpTd47qOyXjRV16kw8+Qvc2wrYlFXpA1CD44SAXPDqRdDbKhXWgXg4PUtvmustzoOa9j/SpK941md1pvEHuMi2fdDLJx/8th3UaeonwmpTScjRoKaaSnoqaz+LnJ8xzwXKm4lNLmJ4cAQIDsQe+OtS1PWPzMMFbRrVud2aMhJtCn+Gk4gTqTHHBfLr2YMQXfszOvDG+wux3NWNy3+fk6Ip3EDnoNryusg26j2G3U44aSfZvpoNnZDc66Tfw07UijzEmXZT3H5ctL9g7mHoKOWhbQ5KzX3Eb6hiZn3WY6anECSednNEnmPATu1dgqnZ2uHNn1QpT3hDNALpxe8dXiTxiPsbsaHAbUie11GuALCsi2F0J2vZHEfiCSOgy6J7bXvSg7E2PKeIzJomwHNcuO+GhDDIcJMDzf6KL34rns9RpxGRspv+nHUe2L70bTvlN9mt2HtFl2Oa4XNnbNTvVOCg1GJ6ydRzkOuUc7DpbJHQaR8pBygThoI9p11DU28fs0ymPMI9Zet1HiqNvERC4+i6ovvvKTuzCD0u5jLzY6D26zTDxppBz0pI0OA25K/KZGM+fTyXev2gJimC/xgLkhcx7c0bbGbYfL4D35FFILwlO+U+zarS/8nHTM8sP8Tq4O6dHANZSLgYyGPsjL3+iC+4bz8FJIR4eZucs8RjZR9prpJE6Dm6htFidgAKvrFseuN6bdx9xjoJ86DHzRJnZ9yJczcD6aCZxxUHwySks9Hx9Y7z+ogOmRDS5DnuD6bSbxRU4XiKM2wv3uLjwLvX3pMZmjThNjr9NIeU2QSlI2LuTr44Db9n3aZ9L5xnbGystEgscNFWiULas63pcJNSvBz9N+O9rD+BosZxz1nuHJsIZO3LiJmwRg8qCchl5ugLrm5+uAdGK39kQqsVS+5hL+tvq95fWX5Br+d4Nld0TZDaQa8ndZMd4TziLr7hrp2xMp1kEGvPf4IkW6LfmuNRNqEoJse2ikBUE23REdMjcN0tFuY6YobHqpysFJo1UPJHfWQ1TM8rVc4zzDTE75TstEjv1Rk01v/Eyt3y0Mr/VssO5NXucpttJupm0HNjLhZmEtlfoR5T66GNm0LpN8aw9lx4tbvYy7j8hRPwg59tIoNyk7rhcmctEedcKh49dbSZyGiKFMEpyG/81x+I64DJeLsdYi10BPE34+Osg4v6OEI7bTKUW2muVpS6AuG236oGbbPkjiO7lUcthnNF8nAAhHbDPgHnyFQkNHi/B/hzKInIedb0U4zvpO7daXFW7rcLOTLyWcfe7fMzbaSGap2V9gMIu29q2BdHTAdG+F0wAk3aqZrskaT06BM0+rEw69y2kS4zHqfjP0la2a7QL/l+G6UthrIdZj9GWYmF6U6gVAJxU8J7ABE1aDlfJ+0Kb8NoZ3VlOOgynKefhDGS6jfCt+dqchSBy7cilfJwcgHLHzsOL2xsrLBPqb2GNMnix/nzbjO7W62bKbRhq+wFhtwn1DYj8AUdsXhcCzwYQp2tL7BtQ1l44/Hom0wyWd1CtCggdlE+54rFVv3HCtK7sRF1huzaXDlWin86yhMNOS9p50Hgamuh6Sx7I3GTicsPC5WrXrMGswUcvIJjw2dG4wsoeGaZ0G/o/seiAmZO5OSEd7jJ6K7JXl49LAZ3AZm35SKmQuvP+XfJJWWpDVm/KefFhu359814nTBS80h3IA+ah3KOhIYid9ljkUTKwurOdTbCWUIjvNT7w0WuNn9ZpQRSU6fAZpKZfhwci5j0bZaUuYGXsiZvuifRzhiNOtZrKOumyT1Qu9kE9qpVlP6p0Uvt5AB8+90FHCoex0y5F96/KQMsGgabmXtOVe3H2gHDDYaI8x9djlGK+hl2G+EtkMeEAsya1KUem27IsoS6iDF7/Bv6EMImf9i+qEI3I2cIH6grJwekDg3c9AUHSEec5LCWe/xw9Su/54wGq2DfQNkaXWFUhHBxj6witeYdCop4F7KWzxvwNn5cFsTdLuWDFf5jHmLte/QaCvcG0C7cP1F/irsMPP6zOpUHIsqJt62RT0w8+ZwFmxrP0gkp/TBfWs0gWTSUsbQxp4bpIG+qnT0Cbs0i9W16kOIBzKeVgpsm/df0m5eOONKzd3XWaDJ1bPcadl4JL6TatVYHJXzw8C45/fD0GAOGkHPTlzwG0WlAO39xXgCZLHSskN6uUB7pDge0Ma0Kl+D0I40NlYK6zAd9olOtxigdjZ4HSjTUtF4Ax4tr9Dxa9dS/lMjQSrgBCOvY5Iej5lI5uwLpj1GndTtLWPgutwUIkiO52ndPDs80zwrPOU//Qisd2g57TajeV4lqG3WRyGASLNsFktCTSsElv3k3ANAA8gstKSS/yn1TA7rRzgQdmYpcOkocb5YsfBj7l0UKnYyqh/ckm54U/xtL6LCEgQu09ER4suqTXujNb9mkXW2g34Pg2Mbb+WBoEODxZFX4XIZ+ohVJn3IRAXHbMyivWeUIfzq56Lqyu5rTZi4lbbkDJFLlkrCTaqFFlpy150SlwmB70nkqCZhWymnTvW9zd0vexT7H5dRNDZW3RBesZaG1GeE2rEuK5IPdn0Z6EB/13Cwfd6k4lYECXxmXBdOZiVOkh9Oej9RgcYFVB+U0uw2fyAsuorJ/uSWu6lHIz4Xj6Tq2QXMvuq61WIxZ8wYfMyWf+pVSLbgSyIctbHBOw6+gp2NUthIgAdpB7sBz+XBhqVM9uXhEOZOD3M9qVLpcEzyynvSddpz/G38CC4Rf76Tr4iDTAqYndaBoJLq35vdbC50XOoUNM82n30TXWSgzqX+k68RoeaEfebSf5+FRtuVkC7jfxJvU+JcfuzvlOusGlbAom+cHMTiYs+A1YP9AXSp4CkbAdJsZVUCH1Y7D76GlicMHigP1FbeqJme+z6hsw5LLqYQdoEP+N74oAZGeAuwZgh6bA+6OeUw+DfqAAjrGvOOdpt1FXaWkvRYNOaoDtCOKRfRi6OwvVagV0yEdffyHhz0HtKB8y8JA6ccZEGCZp1AU+MV6H9STthwqE8x55VXDnTjU3akMB6jr6Fx2wzR/jwb9prwhUaj1fIj/vH8xeko3QDadfhO6Ac+NlqgUygnmjfKfmS+O+sxK6j7nJeBHAH5Tr8FJ485lM+UwokVi8mZEI40FgSazxAd9lvAoWYYLbBbEE6O5BL4MwyMKWYxI26tNNQWQN0MsfBEvnRoAWwn4U9FGSOG1LOFVABX5u06X9IUZXzLsiTQwnvUykb1lKOQ6WkYrcqCYcJNT2lePjw3dra2jef3S7vJrIdVAeDTXkd/7Ub9OBZxRldLliK0J6/P6rNe++5nW4mmLakcwBpOOvfFvnNJA1Px67YKHfSJSY+18kIA/tOvSA5FriEyYkwYk9FGbNxqz3ETsMeyqyVzwmN1ug4EDHh5iGgR1FQ8DYwusiybxM3I3ECVoLIadgDafW+nqis7J/1WSEfY4vvuhwaFTqZnTYM2j0Il/VOy34fSdTSpU0OYHFxnQxbk9BpA2bsVZze9QVXT7KUzUaU64jrLCZEaosy7esQDqAelx3P8JMl+Nlg5gMdzTbQjtOPKx5Wfa64lPA+HuCfSI8HT6X9DY/CvbjJAMqPHLA7FzjDB9qc0wn/RmVH3nkevWoC42LwHISFtJigxE4Ge+UX05ZR9no0MbGhvO6jb4vSsImjtt+J6Knd82bdifQPxA66pXKHATLcbyCOJcMWw9EnuFyQXv2+fEB9Q10xoearWUc98rULqFPWtj8S+UyaqqgvINYk3Af6Chtp8SMMDujwQI4QF6OPhU4h93n2rDMdbJIDlhXXtlB+PJs3solrt6C8Pe+RPnw6/gsmalGE1K5fI1wHMgHrhHzGJ3njTLifLHXrDMZZX04ImNQjWMO4HrzGX5Ee9puk1FX1rijD/iM2ecN6seuIa1KYzNXu2wHCeQP65W8157tiqz+Ps/JgkhB7jDv4tOjEB4/wfUBIuXMj+1JOQx4QqwX3TeyN5CtObPsX1JH0oN9qsf0gGZAEIUibAVLZqQhTyAf5pYe9DGmPsdc5C4VYn57jj8BkINrS8zK44E12eLKKWbMcfqP8jSqIpwBpMXdQriNJeEKSYW8pBW5pec5OUFgwkxvs+yE2ftVwSES7jIhqRTgBRhWKuhMfiOoLPqYCDKuR/bdI4qSH5IcCSOVIc3ZMUycc5ABxEa096pUlOeI/BhPZM/CpIU0L4ZxGjx6RACzMEJhwrrUmHJ16ybNn36rrAeDKSYHgKqQjhOOkfweFjf8Qrold9DNhwHAdCPQx/tPPKzCh8fUwGTYzMIE+50xP+KwLZvafFL/e+gKuU8f8xrVFONDBSWcLM4vkdFFuo4o4woG6xMxO3ECAIsfqXSpodm6j9YuO3QyWjufYC8zJGI1Araw4s6/YxeAacuhJOhNxN4OMyxW1Ba9cTeLAuI0Yok44EHvBJHIQ1/M/1NORzhI4YzcMDq5sCuw24vudRiKRBsExYebLmm37IhCohybHAUjkPjqAtJ+d7g1S33BPy77NDftc2owHAbBFWAmdFlxe6Li4bxzjp3kZJCEmC1inwS8Ix24Adq0HDeGnYyLmrYD7cIRDe459yGZHk37ObF+uh/v6c25yApFhd43eNi+Arwc/31t0xIJYOVwnVgHuoxDfiF0TAdfF7mM9SDC4ZUKRQozGbVR9w7kkfb4ugLQ2uzeFrS8ymWxVxvPEjkObxTGrlvDT8gGWDhtmdgpcHbgXkD7lMSGTnw7AxKwIhv1pyBGToNf4KlQWS+JWkqPhC8T2Oq0IR3o+YZp6Xkncqh1Ky0/5fXvKd+pZ3F++EP34bR1sshV7jH0sSbX79mld0QfYwq1WJxxsBGwnOmLXjIKJFTgG+jJ8PylAGrkokIr6zuVJwCjiltCuI6M1CCc/7XNybaftIkX0ghBsIXjjWU0XfpOdCJ+hQTjW2lkvio4r+KDXBFzBIkkL4cCAY6OXpcCMBdfxg3yMzfTrPMK5L71Xo7FMiNOlaRDO2k7vMHfvfkV5TaiGICu5ZgkzzITrisID/fg6ONAxy7ylQBSWLY3uNIxlj/iR73jTh70mqRMOZ57CvxtI0G/Ib6LdLqRDMb7TcsksoiKcybu4e7BpVgZi6/6NnB457vhS9xH3GvIS2v0UjCxh7VxFzOIAOmK+r3yHhR8smyJU2+5yMR+s95RhGoQTNBMIR0MHm2E7XOI8VMzFHWBSoLwn1suOebaqN+Ku7ViSAd/OAgHXWuwwWCo5FmQB15mgWemEiHEdSGywa5H6o496fnWIbPpVQsCeEDS2CLHlcZyf5mWgQ+YuUSccBls4TOSiWbgffaCg6c8VFPUZLu9HkpjlViRgSvoyWDhjf5UcCRwJOpgdC5dx1g9cJxOCz+SLz/MOksmLD+pC1mcix6G1nD4gHGzpVyioXz6jA2ceaYb4HvQRiKfYaCFWbRGjLbCpG3wUeDBKcVpwsRjX4YiJXdNu0JgDev78Q5isOcKBtqW8Jh7Bz/slPDe4v9zEIj0W2lMetci/MWZxEJu+9QfUshVAcjhwiQbh5MUYqt+HiVkZxRGOwhrcp6nncP1+Toebb1TELQ6VZDksIZ7Pse1f8gmHdla6X0+3GX5ARS1zA44BrlHXr0JbhPOyJVM+4TRjl4qy0j4u8RrbFaThgNcY7L8ewG4b8Rnhe9mM54Tb8mOBepyO30s4eW6d/iHJchmPTTkaSI0EQTGp0dsXWfHzq0OWvFGbsh3AcgHUJuxWYdPRA66pEw7xt620ZXiAUQzEu7C7Q1xH8NsxaWKLYHd7hCOFfSNgVrboacaulcjPkLhufzTYQ77Gsj32bvS2+XEw8LnBROISHqOv0RnWXrIMK1fpQZ8fmaulpE0Vv9R9hi2wfFjtg7Qkn71uk9hjMhmYHJg91l+KnQ3uQ0AQBOJ52Cq9p3hwsytclx32N4UVP+jADUAmbiMLuA7Oxx9JOFBm8VbcJtb9fxZb97spthlwm7Lpfwu79T9heQKTiTrhsMfCDEAHk7guAp4B6ojErxz7I7HvVBJWaA905PwAqf0A0s4kfmjZ+4HkTJwF5T2pTtriTpHYhveknyTHtmtY1epQnEvtJ0/f4sumbfGWY2F3OXgy2dFkEn8Z+IRDJhVrLUZsO/B2g12/W9idPy+rKWx3kgW0RTiywn0zuOvSgrTeTPAsldtGVgDdx8JWAo1zhuzp6C7tEU6H8HsJhwShLLUaKDvdZxAsFllqN7LEj8Md2UoLNbobVNEh5vPUdfxewukEy3VuIywanQYpZzwsrP2g5uce4yby86uDyvL5TOw7pQZMW1JZDn1gsCXCNbDKOMIBHxv//hu70yZJ7DiknluWZRz1JLLdzjOYhNWRxKJog3AkWU7W3DI3Cbg7D6Nkx8NJxF8dMDiZLKdV8riVwWzUcn96xzI/OhoL/I1a6s/GLA2SJv8QxOx303AdOFC+U1KRkzZZVlcOxBcCA4/FlgdxZbwn1ctLjxA90ImYMNNMmMWU7Qdk3QeJnIa0MrGlx3wNcX0olCt9vQmpiN3HnOGuUwrFZ2KnIfeUq26wcDDokfxmscZGTMAfTzhwT3Ch+2BroTcR6EsQT1JdbyGchtxwYpVi1+k45IFrYN1SLiNYJnWTatC1BfmJbYvFdgMbYJCS+IbtwIfY6g8U2w+mubLAKiQTPg/iHao9YX8k+ITDxZSAPMnKqvvoh/Kqc6p9bm1BnXCgX4qstBrpiHn72PhVPmzMygDKc1wNTKwcGSNH3KfdDIibxMdfTjjKClDOgCAwmJXRcOjw2F8PNj5OV58mcRIOv5twOsFyXZ8VyFE50JQdyIASb19CZrP2IKqu/ogKNXnB5HZYn8vo3XCNOuAxXp1wxA56MsmpmEV0yBxvCACTADF04qCZZ9n0LUk4v6JNwtlpY8cRDuy/wG7bA/mNYpV1xwHBpqoAozwgPYgnNfEEth8gNzzIgues4OflQHlPSEcOLYOhZaBxopyVe5H9QbTHuJ/VCOdv2AJNIgFg0sGUS5qUz7S56rrZ+DUh4CqBHiKwSuQyvA53ziTKa3yiyGNcOiacX5TLvRB81W2Upm1p8zDtn0E40E5gecFqGQj8Wz3+piKcU8qvmtIBM/M5wmkJKP8qyds+hn8vdcjOJM0Q2Q6QQP2SVRlMqmz82mQ8wSqt4K0t7muYeVpb7usfAT7hcG0G4w+8B8p9dL289pJG/1KHOuFwOmAMcH2NxKBafm/Ali/lOFTGHvRs1R84/OWEQwpq2acJm9esyFpbgv82cnt7IEgIK0xUxLydiqdPVTPAH0I4dgOXwEY/aHgSj3Ed9ZxN+Z5sIW8PMAsx28xPqQgHIuxO+ulwjeZZONhfb5BkWC1gSvd/JXYaeh/IlDSWlbZC7Dry3vOWJXQNwsm0UxEOxH5ETvr3ZOInGrtVgXAYf6PTQHr8/SPkWbGr2Oyqh5ig2cv5eTmI/abGKRy1Jbjccn5+WPrEZZXKbfpIaO/J1xUVR4n5jmCzWsjcNBgoXPuBhSP2GEtWYFrS/INy0CslGyXVy2Sp3MjJCbeKA9cUuI0wIWW8KN0L/BmEQ54Z+hx+RhDcJyUiq74N3HWVS3VCaeFQwXPPqhOO2GPcL+zF5BH8e6lDei5pqth2AKMiHNtBvzLJm6KwGyfn4nuEcMItErk4yh8NPuFw401k3Q+3bV+p2HPCNcW1glZHcPhoi3CgLUEnjAX4C8TTbKeFZA4Dm8V+07LacqcAfznhkBUYh8F58vPpQ9iijKF06ub52I24y826jZZ4hvWbfk1acqwnp+P3Es6eefP+zsSsmYYfVE5cHRAHvUZJmCk5h9UeRMf8PhJ7T6pVWmG9iR9PO+uT4Ba9/0UMhyMcaabdCrhGxax0hj0sxE0ks72y3G0RDrvH7QcuhkM6qtMQMbvXzZS7zgEIh41cmCb3GHGPttd9gglCNcuQgLVNPwnjM+k+tWOpRl4O4HsrSvbrS6OXrgGS58pFdiv7TL0ozd81qeHsdgP2bMpQ7oiGSCTCVp7pqSYu6IlFYjdA8cxJX1V3DdfODhXhMhELraVMyv7Rg1h5nKgTJQmiuo+pUrBPyY5ydfyRhENcaAhSb1+4DvfTIQ25kSMlJ8NGNlzaNQxiLo2trBhMONkhZJWKjV2VwG32Y2FHsutwmolf2ypwyofkeMgiyk5HDgMVrAA80H+RHt+2mvIYd49bEIHgMxVmdgy1bERtD0BIkpKDXdmi/d+wRSe+keTv7EblxX7KT8cHn3Ca4H6e489KSveNhmeXn08aAttN+PnUoU440LdgHx0es0/wBFEvdtZ/gKWeddC5KnYdkSPd47wa5W1XHefh4y8nHOWyuHarZXHstgTD0hhch47J+E2vUSccXPkf4llCY1lcqnbAkoPIZmCrZXHKWf92vfk3byuuF/WgvCbcABOQNAQs0YaZBPPzq4NN/WEOZaXVrIrTOA6VS3bZkaVJ9aCxinB2239HruXv/5z2HHeFPwDbIhw602qC2EpLZd5DuUSuowrpw+Gt3EoE+ywwwSKK0qbDzOJlttpEH3QIiA9RISbZ8pulQ9C9exrL1XwwbmM7tCwOoNOsBjJuBo+55WEycDzGPqKTtqpmSTpquRXroNvc2oXpBZvJ7tM+k2/S3hNv0b6T68QuBo+4vVagj3E1YLHLMVv9foA/mnBgWVxkP4xYLuqQRi78Tn1ZXH2Vio1evA4mRyWpw/YQPCn4TdsBLiZfDwDqThwwMwv2WUG5ZbBKZTvwCvQ7Omh2DrdKBfuTJK7DnlIHA8bydXAAXfSORX6S4JmX6YAZFTQeY2zo3OtU4g/f89PywSccsizuOZ6EAToKdcIhGwet+8mlx4J/VNyv0ZVfPT9Efr9ch0HoS36+tvAHEM6IHa0IJ9CoHJYE+ek4SE9GTtcknNb7cNig2X4kPrK1hXD8p1+WlOWq9thAA+DBXQP7O0gaWI6zG/RA8fyhBuFgItqF1Df+uY+9+nTb4g/AQsAd/iBXdqhIxnkow6RuXsPXAWCz44dTnuNucvtwyF4UxyF3RL/eIEQoUduHo3KpdjuqzlFJE9d+J4NzJi2mNEhbhIMuRn1E+U4thqVkkmYLpOkPO1X3wOldLp0q/c9ln2I/vIhbklR2bmxNRSwgZ8o6AtZRX2NZHA4eIl5cAQYXno0jOaIHaYIzTYGzLyoe/kS2QgDErgZZsHsbrkuIpYbL5TriNpy9UlQc6k9OuJcf68embjRlnIY+55bYYU8U5T3FTf2eAOxqVwERAGG07MN5PcIJnruQTzhiKx2NeB0Tbr6KTzjcKhUbYT6ccR7GcCQKbSx1GsywKVs38vUAqOhlDnK7flLODYFNo+yOJeA6vSF2HR1A+n1LHZK2dh9TIi043JuvB8Du9zSnbAeiZjgHiMuFrLshxmkILT3qNYGflg98v/eYMLNcdcIRe4xvtQ3lVZAcDl7IX6WSXkp56QJLe6BPx39B4fGsTjjYCFDtUWsXMGCx/JP2GB/LkYPSwjGslPx869u2mB/ysGeT5rQiHBjwtoMOwDUuHR00K6AV4WALR3b7mpa6TmydHCez3VYlWUjs+jcycM7qVm7nlrK9Q4WZO0ts+1PcvcAHp4ONzyke5hATkopbvR7OsnCzLPij2EWi2MTv10JDgR7svv1LciJ8DOM9sRqCs3A/GNSk4/tNJTMFpGNORU3nBY0bmAPua/C1f0C5Yeev2HdaHjmb09LR2iIcgDR22Ubk0A9xG8Ogk8NLw5jIBVG4PO+36HyT3WszjPadVMjaaKuOVHCEw2yzaDMewgeUXRK1eCyfcOigmUfxNTi68ebzyrwPqdTN/SSRCyJp+0GN3PZ/WO6HgUMFzt6GYHcxvO7i5zvaYM1xy+ZAzGQXbcL3UW3c+x061Ow4557BXwrP/rB/g9QZljo47+Wsny931KHhELDcSY+mAwz3Q7mgHvg61dGi4+9M9PIV/J3G2CqcANfU0v2Tjfnue86KUcZpxjyiCjLGw3WF+MEnYv+ZlyAYz8WdyKCx15NI4lbbSO0H9xbZ9+/NpmwaymxfFEbZ9m+QWSljVHDPRtxX5busyB4kKnGdOe00pJmzEuF+5IiK98QS2V5nU7GzQR+xm35f0ZY+PemI+RtpF4OnXIgB2hf249ABM5OhXK2fuDXg+Whcl5hwzrQiHK9JUH+wSxv6Ufs7tVvaVHpy+wo+4cgupRvXKtvgpWVQB6R9Dp6FPx7PHOHgcU57jomG+ufao000ZLl+L0tYl4QtnOucL072ZDgO+Q0PmD2Sg17z1dNjZZ3xjO8gC52bx53LgDyQF3eGesk+D2f0rIzM4OqEA52Echj8XLJjyQH6mJ9qZyW7y24DLNvCwUeSDmZRGzx4A2fkMXFrouhQk4PYhG0i+x9aOghYAUzcd3Beh+toH4q9J14kcSS1TiTCfjcdYnpMEv1dNJ6VMrAl9DM0GFdmWD7Fz0mD7w+NJttpYycLm3uaOyNG0llqNWPz95IsbmW85HQcMZfZlA0meFaUkE1wLZ2nLcJ5ts+rG+U1vpoLzIIQErPup6DDzY7R0d/F0zuWpIldhj+ATWDcShCns6OEA43MJG+0l4fOzoZ65GJApHzYP8cDNZ2JWpIuDp5zDnc4EWxee3HQULlCga2N+0y6zRDUqdMbkl02zrIws1Ni2wENXHlgoIBIAwwvsUk/eON7Ev9eUZDVhYlfs53xGFOt3n/wAKbl2xcdlO5zWyFN2TKtMW5FOu03vZT2nnQNu2FXyN+AmQWymKWp7H6PLeglsQ/pxeQJTOK6aMZv6kXKSumSkQnDsg+SB8/OkSSuc4J0st0Oc2XJPyQxcJaH609bYWANlErCzU7S+91/hHRM5MLVDY4Dm9QPgxI3w1oL+liTUvo0S2AjnyXX7yCY2hd27hbR8auIWww7cKnAmadghfFFu/UmZ/ignC909W5i8P85qxqExHzcRt+VF+9tcwsBByAUJmWDQ0PMkizclr9wk4Ryq4X+HWnsylQYJ4rqEzr8vBwUdRc+k+xxdpMGzbyEvZAmrm+LrPDEGjI3tzFhdQoTs6LdbRd8SPa6L5RGL90H45krDyEeV4NrssR1iexet/X8PCowgbOPgAkMD8ANaG5gICc8g4TOaTWj4Ur+mvKeVIVsW588hbzNYJb7G15TXD5BAobqhKNs/J7Kd79EzE/h9DFXT36FTd4bsIeCSwcBTIiTALGAmco1JlfR5F0xvEBfw9kYA8p9zAOYhbkBp9ynoNQDv6svGwOxkcOe4eZBkB/B6yncRlfASXX15wKByiSrMSlb10FasJZo32kHmmHlraXx2iIcgCT5x6UyJ12ZeufmVq745SIkYKcjE7cQeUcJB8qDrcsqOFGsXm6yVWEr3KMnuQ/UqXKzo/I63ANmZNZ5qIhN3kB2WitCzN+m3UZcJzECtXoHXSDkDJJ1v5/xPYm7Ld/vpwv6oJ7V+4+yrfsS65FxGWGLnGBQtwT2WwTaEl67QG0zhddGtLnTFyDd77Wh0a6fclew2j1AyOl0yz7XIZ3Yb6o/ch2IrenWfRmeg1gEgTMuwOwME5U49rutEic9EbdiBQKWoXJ5HQhZvZ7g7BJ+Jlwv9C7bVgQhuxDXlw6cebShZTFB9fwqXUp9LxYYMNngdmBchoskuxyIpfQywIqq2GloBXLooSTyFv2kbS2V2yZENoMUsjMJxvy8HKSlJ3phsr6JrLpp1B/UFXLSQr9Zas3j52sP4sDZ8cANnEfBlYe0J+YSTGIH+XlUYIKM90FlcWYqJ6AMYg5U6Nxt6ulxBXxF+0wuhrM36umJuQnvzPE3rFJUHu0CaXFDBELQmLtOXApbTDiRC+PUddJx6yxoR70GGIDqjaYuZADCfhJHbSTyN0pWbPtR40147G6X2XimvQMztnrj8PXAwIMgIOtveBJeNQp5EXk9xZhC2NPAfy7QBQFtJsVyNXcvcM8oe10KdJGYBDaPsSmtcbYFrA8qfH4EYz9QQY78qzUSJ6TuwBS37gdb9SPFln0oslxp0xcx4RYaJMYHEA5lp1MMg4pf9ralZQnUti8MonrsJqk6myJr69uU+8jLsPyvma8X2SsEO3qhviC9/KDfIEyQUuX5oBdC6gQCxH6GabTLKEsgBr4uog/2e4Sbw25WjbgWB+lej/VQN9Ch+fnhJL7IUusypMOTnRfsGoe+y09HdhcHzMqF9uD04n63kHbQpYHI2moXEDLxwmtVXPTvSY6Ftbn6SQ6EBs1KhQkM2k2dqF9Ir5btBH0Q6zn2BpXpMoevpy2A6005DyskBynbqD9iWdgOYmW5cRqbSjnAQg3jO7WWrBTz8kPfhtjocyvtdldB+aADjXcAN/DrGdqccEmISfuxJSbc/DByH4KaHAehRkcdlTTj/yNPfUwOC1pFnsHCoYNmVsBMop4eBDkPQEyoyRXOwmHCTEORx4vrcA/kPhTRMSuS1XUCqOhl62i3kfXIaQA59AVxAIgfwNIuVDZy6oekrsOeMoEzo6lf6toNZssLDg6ifadcAAYGUgQdnBBdmIFZV4PHksgFDqisTGXGw4xN+04tR26t64GU2wk/m6suglc2qt9LHLEgFrnqoWYnqKuhcAp8n/p1DmVlZf+kk9ZtlLrqP25w0iMNDGWBlTUoYzPsI3IxuEknrLWU5kT0ENv0lyJXHeWGvx1L9vL18UEsLheDCuTeutxtCTyL1FEXyVyG/swEGB2Sn05pZYoD4dC+k67B8/LzgiA3HUQ5Db2vsnCOhuiK7XQVyIV3H9LWgxEVPCeT8Zxogzzb0ecyED/jYiCC9i2cQ34bGlyGIYWzZtsgd10kste7BunokDl+yNuA9F2NdPh56DCzc+qEA6B2LFklc9X/rdlZl7QL11dg9QmscYnTYFhNK5YcCdB4X5A6cH18wgbPyJQ7D5EpoD/YgiWj1AWTGMTypC5DKcp3cpas6FB/fv72QAjHc2wZctd8JvJcuE7EzsObZOdSXm7hBBvXwfjk528CHZ5D0HMHvZe+F1wddLhFHHADv56VbT4EMRHzD/DzqEAlfW/K+E1zZXynOVHq4jPZmQmY4UonbZqqnh58dyZu5Qrac7JHq/Qg3pPcmLjVq7gP09FJ6yfR3lO8uOvkHn6GrrKdVkbqOjkwRft1sW/vJfEce4D2m1ZA+U0rx35/Ies18Rh2l8KkJ4In8/O0BfKBvABDX6nflAv4vpexVFK+U6vwc5aKvCYmS06EaHQeiCEwkYuX096az0XK7TPNVX7Qu9VOTsmZhG7YZXBmfLD4G7qxO5a3uSuTQ8PZ2PFUsLE97T4ynvabWox1V0MZ4cVR0rpSsveoHrs02Py1YXymuEK7sKlbXjkTgosAO5HFXlM8+WXnC5SVDjG1aqg5oV/fxrt6UZ7bP6jIxasZ/Lz8vCDYunVnA2d/z8Vc6Jyozxl/I1tcvy6t7kP+4jqJXzWbjVg4XOwz2Zuvi+jzmuwuSd08H0iTXxYO8tyowUzATEcou0Z+76kelJ8RsTyp2DXjqcBZbtB3+engeSTJGxaAS8XXT+/3mErhvk55jEti/aaVYXe5gvadfEnsYrCdjl6xkXl0p0NLxWCl0Zm2i8Qe4zzFnuMO0f7Tq3A/LmV8p5wSu42Jke3tmFWjDgSHZ8PnLRd7TWq7baGfhBjbwAvo+Hk5wPuepHGr18D45OeHdhL7GXqKA4w1NqW2ByZpw3TgBorXHqCLweMbYpz8PP+rgZRR9y8lz37pBi6coo2B0RHALCy9V90TPbzTXXH3eg/8f43NaH8VcFm6oF9v9OQsBQH/O6CQSLoh6fPuuF1a7Zd6XQBRwAv7FZLfuir+pPNVAgT810A9PsG/9n8R8PIuNmmdpyTAcD8dMjdZ5Daiw+8hEiBAwJ+M/2+EoyjIepsOnFlIDgLb6zTB/hl+GgECBPxF+H9JOP5GF+Cl8mLbgRLYtMdPI0CAgL8I/y8JJ8DoPHmzn+1AViCcPw7/A4aor+HJJK+7AAAAAElFTkSuQmCC>