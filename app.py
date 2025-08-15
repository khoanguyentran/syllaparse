from flask import Flask, render_template, request, send_file, jsonify
import PyPDF2
import re
from datetime import datetime, timedelta
from dateutil import parser
from ics import Calendar, Event
import io
import os

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def extract_course_info(pdf_text):
    """Extract course information from PDF text"""
    course_info = {
        'course_name': '',
        'course_code': '',
        'instructor': '',
        'meeting_times': [],
        'start_date': '',
        'end_date': '',
        'location': ''
    }
    
    # Extract course name and code
    course_patterns = [
        r'Course:\s*([^\n]+)',
        r'Course Name:\s*([^\n]+)',
        r'([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\s*[-–]\s*([^\n]+)',
        r'([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\s*([^\n]+)'
    ]
    
    for pattern in course_patterns:
        match = re.search(pattern, pdf_text, re.IGNORECASE)
        if match:
            if len(match.groups()) == 2:
                course_info['course_code'] = match.group(1).strip()
                course_info['course_name'] = match.group(2).strip()
            else:
                course_info['course_name'] = match.group(1).strip()
            break
    
    # Extract instructor
    instructor_patterns = [
        r'Instructor:\s*([^\n]+)',
        r'Professor:\s*([^\n]+)',
        r'Faculty:\s*([^\n]+)',
        r'([A-Z][a-z]+ [A-Z][a-z]+)\s*\(Instructor\)'
    ]
    
    for pattern in instructor_patterns:
        match = re.search(pattern, pdf_text, re.IGNORECASE)
        if match:
            course_info['instructor'] = match.group(1).strip()
            break
    
    # Extract meeting times
    time_patterns = [
        r'(\w+)\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)',
        r'(\w+)\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})',
        r'(\w+)\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*to\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)'
    ]
    
    for pattern in time_patterns:
        matches = re.findall(pattern, pdf_text, re.IGNORECASE)
        for match in matches:
            day, start_time, end_time = match
            course_info['meeting_times'].append({
                'day': day.strip(),
                'start_time': start_time.strip(),
                'end_time': end_time.strip()
            })
    
    # Extract dates
    date_patterns = [
        r'Start Date:\s*(\d{1,2}/\d{1,2}/\d{4})',
        r'Start Date:\s*(\w+ \d{1,2}, \d{4})',
        r'End Date:\s*(\d{1,2}/\d{1,2}/\d{4})',
        r'End Date:\s*(\w+ \d{1,2}, \d{4})',
        r'(\d{1,2}/\d{1,2}/\d{4})\s*[-–]\s*(\d{1,2}/\d{1,2}/\d{4})'
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, pdf_text, re.IGNORECASE)
        if match:
            if len(match.groups()) == 2:
                course_info['start_date'] = match.group(1).strip()
                course_info['end_date'] = match.group(2).strip()
            elif 'start' in pattern.lower():
                course_info['start_date'] = match.group(1).strip()
            elif 'end' in pattern.lower():
                course_info['end_date'] = match.group(1).strip()
    
    # Extract location
    location_patterns = [
        r'Location:\s*([^\n]+)',
        r'Room:\s*([^\n]+)',
        r'Building:\s*([^\n]+)',
        r'(\w+ \d{3,4})',  # Building and room number
    ]
    
    for pattern in location_patterns:
        match = re.search(pattern, pdf_text, re.IGNORECASE)
        if match:
            course_info['location'] = match.group(1).strip()
            break
    
    return course_info

def generate_ics(course_info):
    """Generate ICS file from course information"""
    cal = Calendar()
    
    if not course_info['meeting_times'] or not course_info['start_date']:
        return None
    
    # Parse start date
    try:
        if '/' in course_info['start_date']:
            start_date = datetime.strptime(course_info['start_date'], '%m/%d/%Y')
        else:
            start_date = parser.parse(course_info['start_date'])
    except:
        # Default to current semester if date parsing fails
        current_year = datetime.now().year
        start_date = datetime(current_year, 9, 1)  # September 1st
    
    # Parse end date
    try:
        if course_info['end_date']:
            if '/' in course_info['end_date']:
                end_date = datetime.strptime(course_info['end_date'], '%m/%d/%Y')
            else:
                end_date = parser.parse(course_info['end_date'])
        else:
            # Default to end of semester if no end date
            end_date = datetime(start_date.year, 12, 15)
    except:
        end_date = datetime(start_date.year, 12, 15)
    
    # Day mapping
    day_mapping = {
        'monday': 0, 'mon': 0,
        'tuesday': 1, 'tue': 1, 'tues': 1,
        'wednesday': 2, 'wed': 2,
        'thursday': 3, 'thu': 3, 'thurs': 3,
        'friday': 4, 'fri': 4,
        'saturday': 5, 'sat': 5,
        'sunday': 6, 'sun': 6
    }
    
    for meeting in course_info['meeting_times']:
        day_name = meeting['day'].lower()
        if day_name not in day_mapping:
            continue
            
        day_num = day_mapping[day_name]
        
        # Calculate first occurrence of this day
        days_ahead = day_num - start_date.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        first_occurrence = start_date + timedelta(days=days_ahead)
        
        # Parse times
        start_time_str = meeting['start_time']
        end_time_str = meeting['end_time']
        
        # Add AM/PM if not present
        if 'AM' not in start_time_str.upper() and 'PM' not in start_time_str.upper():
            if ':' in start_time_str:
                hour, minute = start_time_str.split(':')
                hour = int(hour)
                if hour < 12:
                    start_time_str += ' AM'
                else:
                    start_time_str += ' PM'
        
        if 'AM' not in end_time_str.upper() and 'PM' not in end_time_str.upper():
            if ':' in end_time_str:
                hour, minute = end_time_str.split(':')
                hour = int(hour)
                if hour < 12:
                    end_time_str += ' AM'
                else:
                    end_time_str += ' PM'
        
        try:
            start_time = parser.parse(start_time_str)
            end_time = parser.parse(end_time_str)
        except:
            # Default times if parsing fails
            start_time = datetime.strptime('09:00 AM', '%I:%M %p')
            end_time = datetime.strptime('10:30 AM', '%I:%M %p')
        
        # Create recurring event
        event = Event()
        event.name = f"{course_info['course_code']} - {course_info['course_name']}"
        event.description = f"Instructor: {course_info['instructor']}\nLocation: {course_info['location']}"
        event.location = course_info['location']
        
        # Set start and end times
        event.begin = datetime.combine(first_occurrence.date(), start_time.time())
        event.end = datetime.combine(first_occurrence.date(), end_time.time())
        
        # Add recurrence rule (weekly until end date)
        event.rrule = f"FREQ=WEEKLY;UNTIL={end_date.strftime('%Y%m%d')}"
        
        cal.events.add(event)
    
    return cal

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Please upload a PDF file'}), 400
    
    try:
        # Read PDF
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        # Extract course information
        course_info = extract_course_info(text)
        
        # Generate ICS
        cal = generate_ics(course_info)
        if not cal:
            return jsonify({'error': 'Could not extract sufficient course information'}), 400
        
        # Create ICS file in memory
        ics_content = str(cal)
        ics_io = io.BytesIO(ics_content.encode('utf-8'))
        ics_io.seek(0)
        
        # Return course info and ICS file
        return jsonify({
            'success': True,
            'course_info': course_info,
            'ics_filename': f"{course_info['course_code'] or 'course'}_schedule.ics"
        })
        
    except Exception as e:
        return jsonify({'error': f'Error processing PDF: {str(e)}'}), 500

@app.route('/download/<filename>')
def download_ics(filename):
    # This would typically serve the generated ICS file
    # For now, we'll return a placeholder
    return jsonify({'message': 'ICS file would be downloaded here'})

@app.route('/generate_ics', methods=['POST'])
def generate_ics_file():
    try:
        data = request.get_json()
        course_info = data.get('course_info')
        
        if not course_info:
            return jsonify({'error': 'No course information provided'}), 400
        
        # Generate ICS
        cal = generate_ics(course_info)
        if not cal:
            return jsonify({'error': 'Could not generate ICS file'}), 400
        
        # Create ICS file in memory
        ics_content = str(cal)
        ics_io = io.BytesIO(ics_content.encode('utf-8'))
        ics_io.seek(0)
        
        filename = f"{course_info.get('course_code', 'course')}_schedule.ics"
        
        return send_file(
            ics_io,
            as_attachment=True,
            download_name=filename,
            mimetype='text/calendar'
        )
        
    except Exception as e:
        return jsonify({'error': f'Error generating ICS file: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
