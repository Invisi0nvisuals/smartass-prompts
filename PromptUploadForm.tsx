'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { UploadButton, UploadDropzone } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { cn } from '@/lib/utils';

// Zod validation schema
const promptFileSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size must be less than 5MB"
    })
    .refine((file) => {
      const allowedTypes = [
        'text/plain',
        'text/markdown',
        'application/json',
        'text/csv'
      ];
      return allowedTypes.includes(file.type);
    }, {
      message: "File must be .txt, .md, .json, or .csv format"
    }),
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  category: z.enum(['creative', 'technical', 'business', 'educational', 'other']),
  tags: z.array(z.string()).max(5, "Maximum 5 tags allowed")
});

type PromptFormData = z.infer<typeof promptFileSchema>;

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  key: string;
}

interface PromptUploadFormProps {
  onUploadComplete?: (data: PromptFormData & { fileUrl: string }) => void;
  onUploadError?: (error: string) => void;
}

export default function PromptUploadForm({ 
  onUploadComplete, 
  onUploadError 
}: PromptUploadFormProps) {
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

  // Handle drag and drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file immediately
      try {
        promptFileSchema.pick({ file: true }).parse({ file });
        setSelectedFile(file);
        setErrors(prev => ({ ...prev, file: '' }));
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors(prev => ({ 
            ...prev, 
            file: error.errors[0]?.message || 'Invalid file' 
          }));
        }
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/json': ['.json'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // Handle form input changes
  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle tag addition
  const addTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  // Handle tag removal
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Validate form
  const validateForm = () => {
    try {
      if (!selectedFile) {
        throw new z.ZodError([{
          code: 'custom',
          path: ['file'],
          message: 'Please select a file to upload'
        }]);
      }

      promptFileSchema.parse({
        file: selectedFile,
        ...formData
      });
      
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      // This would typically integrate with UploadThing
      // For now, we'll simulate the upload process
      const formDataToUpload = new FormData();
      formDataToUpload.append('file', selectedFile);
      formDataToUpload.append('title', formData.title);
      formDataToUpload.append('description', formData.description);
      formDataToUpload.append('category', formData.category);
      formDataToUpload.append('tags', JSON.stringify(formData.tags));

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockFileUrl = `https://uploadthing.com/f/${Date.now()}-${selectedFile.name}`;
      
      setUploadedFile({
        name: selectedFile.name,
        size: selectedFile.size,
        url: mockFileUrl,
        key: `${Date.now()}-${selectedFile.name}`
      });

      onUploadComplete?.({
        ...formData,
        file: selectedFile,
        fileUrl: mockFileUrl
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'other',
        tags: []
      });
      setSelectedFile(null);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      setErrors(prev => ({ ...prev, submit: errorMessage }));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Prompt File
        </h2>
        <p className="text-gray-600">
          Share your prompt with the community. Upload files up to 5MB in .txt, .md, .json, or .csv format.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Prompt File *
          </label>
          
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive 
                ? "border-blue-400 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400",
              errors.file && "border-red-300 bg-red-50"
            )}
          >
            <input {...getInputProps()} />
            
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-2">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragActive ? "Drop your file here" : "Drag & drop your prompt file"}
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse (.txt, .md, .json, .csv - max 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {errors.file && (
            <div className="flex items-center space-x-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.file}</span>
            </div>
          )}
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              errors.title ? "border-red-300" : "border-gray-300"
            )}
            placeholder="Enter a descriptive title for your prompt"
          />
          {errors.title && (
            <div className="flex items-center space-x-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.title}</span>
            </div>
          )}
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              errors.description ? "border-red-300" : "border-gray-300"
            )}
            placeholder="Describe what this prompt does and how to use it"
          />
          {errors.description && (
            <div className="flex items-center space-x-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.description}</span>
            </div>
          )}
        </div>

        {/* Category Select */}
        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="creative">Creative</option>
            <option value="technical">Technical</option>
            <option value="business">Business</option>
            <option value="educational">Educational</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Tags Input */}
        <div className="space-y-2">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags (max 5)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyPress}
            disabled={formData.tags.length >= 5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            placeholder={formData.tags.length >= 5 ? "Maximum tags reached" : "Add tags (press Enter or comma to add)"}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className={cn(
              "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white",
              isUploading || !selectedFile
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            )}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              "Upload Prompt"
            )}
          </button>
        </div>

        {/* Error Display */}
        {errors.submit && (
          <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Success Display */}
        {uploadedFile && (
          <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span>File uploaded successfully!</span>
          </div>
        )}
      </form>
    </div>
  );
}

