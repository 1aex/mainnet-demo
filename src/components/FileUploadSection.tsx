import { useState, useRef, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Upload, FileText, CheckCircle2, X } from "lucide-react";
import { Control } from "react-hook-form";
import { PinataSDK } from 'pinata-web3';

interface FileUploadSectionProps {
  control: Control<any>;
  fileUploaded: boolean;
  setFileUploaded: (value: boolean) => void;
  uploadedFileName: string;
  setUploadedFileName: (value: string) => void;
  label?: string; // Add label prop
  imageOnly?: boolean; // Add imageOnly prop
}

export const FileUploadSection = ({
  control,
  fileUploaded,
  setFileUploaded,
  uploadedFileName,
  setUploadedFileName,
  label = "Upload File",
  imageOnly = false,
}: FileUploadSectionProps) => {
  const { toast } = useToast();
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
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB.",
        variant: "destructive",
      });
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
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, JPG, PNG, MP3, or MP4 file.",
        variant: "destructive",
      });
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

      toast({
        title: "File uploaded successfully",
        description: "Your file has been uploaded to IPFS and is ready for registration.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
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
      <Label>{label}</Label>
      <div 
        className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {fileUploaded ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-sm font-medium flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>{uploadedFileName}</span>
            </div>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setFileUploaded(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerFileInput}
              >
                <Upload className="h-4 w-4 mr-1" />
                Replace
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-ippurple/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-ippurple" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, JPG, PNG, MP3, MP4 (max 50MB)
              </p>
            </div>
            <FormField
              control={control}
              name="mediaType"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="Select media type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {imageOnly ? (
                        <SelectItem value="image">Image</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                          <SelectItem value="script">Script</SelectItem>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept={imageOnly ? "image/*" : ".pdf,.jpg,.jpeg,.png,.mp3,.mp4"}
            />
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileInput}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Uploading...
                </>
              ) : (
                "Choose File"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
