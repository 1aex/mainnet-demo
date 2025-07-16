import { useState, useRef, type ChangeEvent } from "react";
import { PinataSDK } from 'pinata-web3';

interface FileUploadSectionProps {
  fileUploaded: boolean;
  setFileUploaded: (value: boolean) => void;
  uploadedFileName: string;
  setUploadedFileName: (value: string) => void;
  label?: string;
  imageOnly?: boolean;
}

export const FileUploadSection = ({
  fileUploaded,
  setFileUploaded,
  uploadedFileName,
  setUploadedFileName,
  label = "Upload File",
  imageOnly = false,
}: FileUploadSectionProps) => {
  // const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize Pinata SDK
  const pinata = new PinataSDK({
    pinataJwt: import.meta.env.VITE_PINATA_JWT || '',
  });
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      console.error("File too large");
      return;
    }
    
    // Check file type
    const allowedTypes = [
      "image/jpeg", 
      "image/png", 
      "application/pdf", 
      "audio/mpeg", 
      "video/mp4"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      console.error("Unsupported file type");
      return;
    }
    
    setUploading(true);
    
    try {
      // Upload file to IPFS via Pinata
      const uploadResult = await pinata.upload.file(file);
      
      if (!uploadResult.IpfsHash) {
        throw new Error("Failed to upload file to IPFS");
      }

      const ipfsUrl = `ipfs://${uploadResult.IpfsHash}`;
      
      setFileUploaded(true);
      setUploadedFileName(uploadResult.IpfsHash);

      console.log("File uploaded successfully to IPFS:", ipfsUrl);

      console.log("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) {
      return;
    }
    
    // Create an event-like object to reuse our existing handler
    const fileChangeEvent = {
      target: {
        files: e.dataTransfer.files
      }
    } as unknown as ChangeEvent<HTMLInputElement>;
    
    handleFileChange(fileChangeEvent);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {fileUploaded ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-lg">✓</span>
            </div>
            <div className="text-sm font-medium flex items-center gap-1.5">
              <span className="text-gray-600">📄</span>
              <span>{uploadedFileName}</span>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                onClick={() => setFileUploaded(false)}
              >
                ❌ Remove
              </button>
              <button
                type="button"
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                onClick={triggerFileInput}
              >
                📤 Replace
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-lg">📤</span>
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports PDF, JPG, PNG, MP3, MP4 (max 50MB)
              </p>
            </div>
            <select
              className="w-60 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue=""
            >
              <option value="" disabled>Select media type</option>
              {imageOnly ? (
                <option value="image">Image</option>
              ) : (
                <>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="script">Script</option>
                  <option value="pdf">PDF Document</option>
                  <option value="other">Other</option>
                </>
              )}
            </select>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept={imageOnly ? "image/*" : ".pdf,.jpg,.jpeg,.png,.mp3,.mp4"}
            />
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              onClick={triggerFileInput}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block"></div>
                  Uploading...
                </>
              ) : (
                "Choose File"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
