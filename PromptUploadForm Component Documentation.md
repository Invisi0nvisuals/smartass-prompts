# PromptUploadForm Component Documentation

## Overview

The `PromptUploadForm` component provides a comprehensive drag-and-drop file upload interface for users to submit prompt files to the Smartass Prompts platform. It includes validation, file processing, metadata collection, and integration with UploadThing for file storage.

## Features

- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **File Validation**: Zod-based validation with size and type restrictions
- **Metadata Collection**: Title, description, category, and tags
- **Real-time Validation**: Immediate feedback on form errors
- **Upload Progress**: Visual indicators during file upload
- **Responsive Design**: Works on desktop and mobile devices

## Props

```typescript
interface PromptUploadFormProps {
  onUploadComplete?: (data: PromptFormData & { fileUrl: string }) => void;
  onUploadError?: (error: string) => void;
}
```

### onUploadComplete
- **Type**: `(data: PromptFormData & { fileUrl: string }) => void`
- **Optional**: Yes
- **Description**: Callback function called when upload completes successfully
- **Parameters**: 
  - `data`: Complete form data including file URL

### onUploadError
- **Type**: `(error: string) => void`
- **Optional**: Yes
- **Description**: Callback function called when upload fails
- **Parameters**: 
  - `error`: Error message string

## File Validation Rules

### Supported File Types
- `.txt` (text/plain)
- `.md` (text/markdown)
- `.json` (application/json)
- `.csv` (text/csv)

### File Size Limit
- Maximum: 5MB (5,242,880 bytes)
- Validation occurs both client-side and server-side

### Content Validation
- **Title**: 3-100 characters
- **Description**: 10-500 characters
- **Category**: One of: creative, technical, business, educational, other
- **Tags**: Maximum 5 tags per prompt

## Usage Examples

### Basic Usage

```tsx
import PromptUploadForm from '@/components/PromptUploadForm';

export default function UploadPage() {
  const handleUploadComplete = (data) => {
    console.log('Upload completed:', data);
    // Handle successful upload
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
    // Handle upload error
  };

  return (
    <div className="container mx-auto py-8">
      <PromptUploadForm
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />
    </div>
  );
}
```

### With Custom Styling

```tsx
import PromptUploadForm from '@/components/PromptUploadForm';

export default function CustomUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Share Your Prompt
        </h1>
        <PromptUploadForm
          onUploadComplete={(data) => {
            // Redirect to prompt page
            window.location.href = `/prompts/${data.id}`;
          }}
          onUploadError={(error) => {
            // Show toast notification
            toast.error(error);
          }}
        />
      </div>
    </div>
  );
}
```

## Form Fields

### File Upload Area
- **Type**: Drag & drop zone with file picker
- **Validation**: File type, size, and format
- **Visual States**: Default, drag active, file selected, error
- **Accessibility**: Keyboard navigation and screen reader support

### Title Field
- **Type**: Text input
- **Required**: Yes
- **Validation**: 3-100 characters
- **Placeholder**: "Enter a descriptive title for your prompt"

### Description Field
- **Type**: Textarea (4 rows)
- **Required**: Yes
- **Validation**: 10-500 characters
- **Placeholder**: "Describe what this prompt does and how to use it"

### Category Field
- **Type**: Select dropdown
- **Required**: Yes
- **Options**: Creative, Technical, Business, Educational, Other
- **Default**: Other

### Tags Field
- **Type**: Dynamic tag input
- **Required**: No
- **Validation**: Maximum 5 tags
- **Interaction**: Type and press Enter/comma to add tags
- **Features**: Tag removal, duplicate prevention

## State Management

The component uses React hooks for state management:

```typescript
const [formData, setFormData] = useState({
  title: '',
  description: '',
  category: 'other' as const,
  tags: [] as string[],
});
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
const [isUploading, setIsUploading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
const [tagInput, setTagInput] = useState('');
```

## Error Handling

### Client-Side Validation
- Real-time validation using Zod schemas
- Visual error indicators with descriptive messages
- Field-level error clearing on user input

### Server-Side Errors
- Network error handling
- Upload failure recovery
- User-friendly error messages

### Error Display
```tsx
{errors.field && (
  <div className="flex items-center space-x-1 text-red-600 text-sm">
    <AlertCircle className="h-4 w-4" />
    <span>{errors.field}</span>
  </div>
)}
```

## Integration Points

### UploadThing Integration
- File upload service integration
- Progress tracking
- Error handling
- File URL generation

### Supabase Integration
- Metadata storage in `prompt_metadata` table
- User authentication via RLS policies
- File reference storage

### AI Evaluation Integration
- Automatic prompt scoring after upload
- Tag suggestion generation
- Category classification

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: ARIA labels and descriptions
- **Focus Management**: Proper focus indicators and tab order
- **Color Contrast**: WCAG AA compliant color schemes
- **Error Announcements**: Screen reader accessible error messages

## Performance Considerations

- **File Size Validation**: Client-side validation prevents large uploads
- **Lazy Loading**: Component code splitting for better performance
- **Debounced Validation**: Reduces validation calls during typing
- **Memory Management**: Proper cleanup of file objects

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **File API**: Required for drag & drop functionality
- **FormData**: Required for file upload
- **CSS Grid/Flexbox**: Required for responsive layout

## Testing

### Unit Tests
```bash
npm test -- PromptUploadForm.test.tsx
```

### Integration Tests
```bash
npm run test:integration -- upload-flow
```

### E2E Tests
```bash
npm run test:e2e -- upload-form
```

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size (must be < 5MB)
   - Verify file type is supported
   - Ensure network connectivity

2. **Validation Errors**
   - Check all required fields are filled
   - Verify title/description length
   - Ensure category is selected

3. **Drag & Drop Not Working**
   - Check browser support for File API
   - Verify JavaScript is enabled
   - Test with different file types

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG = process.env.NODE_ENV === 'development';
```

## Future Enhancements

- **Bulk Upload**: Support for multiple file uploads
- **File Preview**: Preview prompt content before upload
- **Auto-Save**: Save draft prompts automatically
- **Upload Resume**: Resume interrupted uploads
- **Advanced Validation**: Content-based validation rules

