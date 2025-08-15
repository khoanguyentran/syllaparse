# 📚 Syllabus Parser - Course Calendar Generator

A modern web application that automatically extracts course information from PDF syllabi and generates ICS calendar files for easy import into Google Calendar, Outlook, and other calendar applications.

## ✨ Features

- **Drag & Drop Interface**: Easy PDF upload with modern, responsive design
- **Smart Parsing**: Automatically extracts course information using pattern recognition
- **ICS Generation**: Creates standard calendar files compatible with all major calendar apps
- **Google Calendar Integration**: Direct download and import instructions
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. **Clone or download the project**
   ```bash
   cd syllaparse
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## 📖 How to Use

### 1. Upload Your Syllabus
- Drag and drop your PDF syllabus file onto the upload area
- Or click the upload area to browse and select a file
- Supported format: PDF only
- Maximum file size: 16MB

### 2. Automatic Processing
- The app will automatically extract course information including:
  - Course code and name
  - Instructor name
  - Meeting times and days
  - Location/room
  - Start and end dates

### 3. Generate Calendar File
- Review the extracted information
- Click "Download ICS File" to get your calendar file
- The file will be named: `[COURSE_CODE]_schedule.ics`

### 4. Import to Google Calendar
1. Go to [Google Calendar](https://calendar.google.com/)
2. Click the gear icon → Settings
3. Go to "Import & Export" tab
4. Click "Select file from your computer"
5. Choose your downloaded ICS file
6. Select your calendar and click "Import"

## 🔧 Technical Details

### Backend
- **Flask**: Python web framework
- **PyPDF2**: PDF text extraction
- **python-dateutil**: Date parsing utilities
- **ics**: ICS file generation library

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with gradients and animations
- **JavaScript**: Interactive functionality and file handling

### PDF Parsing Patterns
The application uses regex patterns to identify:
- Course codes (e.g., "CS 101", "MATH 201A")
- Meeting times (e.g., "Monday 9:00 AM - 10:30 AM")
- Dates (multiple formats supported)
- Instructor names
- Room locations

## 📁 Project Structure

```
syllaparse/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── templates/          # HTML templates
│   └── index.html     # Main application interface
└── README.md          # This file
```

## 🛠️ Customization

### Adding New Parsing Patterns
Edit the `extract_course_info()` function in `app.py` to add new regex patterns for different syllabus formats.

### Styling Changes
Modify the CSS in `templates/index.html` to customize the appearance and layout.

### File Size Limits
Adjust the `MAX_CONTENT_LENGTH` configuration in `app.py` if you need to handle larger files.

## 🐛 Troubleshooting

### Common Issues

1. **"No file uploaded" error**
   - Ensure you're selecting a PDF file
   - Check that the file size is under 16MB

2. **"Could not extract sufficient course information"**
   - The PDF might not contain the expected format
   - Try a different syllabus or check the PDF text extraction

3. **ICS file won't import**
   - Verify the file downloaded completely
   - Check that your calendar application supports ICS files
   - Try importing to a different calendar app first

### Debug Mode
The application runs in debug mode by default. Check the terminal for detailed error messages and logs.

## 🔒 Security Notes

- The application processes files in memory and doesn't store uploaded files
- Maximum file size is limited to prevent abuse
- Only PDF files are accepted

## 📱 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application!

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with Flask and modern web technologies
- Inspired by the need to simplify course schedule management
- Uses open-source libraries for PDF processing and calendar generation

---

**Happy scheduling! 📅✨**
