"""
Predefined prompts for syllabus parsing tasks
"""

SYLLABUS_PARSE_PROMPT = """
Please analyze the following syllabus text and extract key information in JSON format. 
Return only valid JSON with the following structure:

{
    "course_info": {
        "course_name": "string",
        "course_code": "string",
        "instructor": "string",
        "semester": "string",
        "credits": "number"
    },
    "schedule": {
        "meeting_times": "string",
        "location": "string",
        "office_hours": "string"
    },
    "grading": {
        "grading_scale": "string",
        "assignments": [
            {
                "name": "string",
                "weight": "string",
                "due_date": "string"
            }
        ]
    },
    "policies": {
        "attendance": "string",
        "late_work": "string",
        "academic_integrity": "string"
    },
    "materials": {
        "required_texts": ["string"],
        "recommended_texts": ["string"],
        "other_materials": ["string"]
    }
}

Syllabus text:
{text}

Extract the information and return only the JSON response:
"""

ASSIGNMENT_EXTRACT_PROMPT = """
Extract all assignment information from this syllabus text. Return a JSON array of assignments with this structure:

[
    {
        "name": "Assignment name",
        "description": "Brief description",
        "due_date": "Due date if mentioned",
        "weight": "Percentage or points if mentioned",
        "type": "Assignment type (exam, project, etc.)"
    }
]

Syllabus text:
{text}

Return only the JSON array:
"""

COURSE_INFO_PROMPT = """
Extract basic course information from this syllabus. Return JSON with this structure:

{
    "course_name": "Full course name",
    "course_code": "Course code/number",
    "instructor": "Instructor name",
    "semester": "Semester/term",
    "credits": "Number of credits"
}

Syllabus text:
{text}

Return only the JSON:
"""

GRADING_POLICY_PROMPT = """
Extract grading policy information from this syllabus. Return JSON with this structure:

{
    "grading_scale": "Overall grading scale (A-F, 0-100, etc.)",
    "grade_breakdown": {
        "assignments": "percentage or points",
        "exams": "percentage or points",
        "participation": "percentage or points",
        "other": "percentage or points"
    },
    "passing_grade": "Minimum grade to pass",
    "late_policy": "Policy for late submissions"
}

Syllabus text:
{text}

Return only the JSON:
"""

SCHEDULE_EXTRACT_PROMPT = """
Extract schedule and meeting information from this syllabus. Return JSON with this structure:

{
    "meeting_times": "Class meeting times (e.g., MWF 10:00-10:50)",
    "location": "Classroom location",
    "office_hours": "Instructor office hours",
    "exam_dates": [
        {
            "type": "Midterm/Final/etc.",
            "date": "Date if mentioned",
            "time": "Time if mentioned"
        }
    ]
}

Syllabus text:
{text}

Return only the JSON:
"""
