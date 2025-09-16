import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Loader2, FileDown } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { downloadUserTemplate } from "@/lib/csv-utils";

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

const VALID_ROLES = ["admin", "maintenance", "faculty/staff"];

export function BulkUploadDialog({ fetchUsers, departments }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'success', 'error'
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const resetForm = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setUploadStatus(null);
    setUploadMessage("");
  };

  const validateCSVData = (data) => {
    // Check if data has required columns
    const headers = data[0];
    const requiredHeaders = ["User Name", "Password", "Department", "Role"];
    
    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        throw new Error(`Missing required column: ${header}`);
      }
    }
    
    // Check each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userEntry = {};
      
      // Map row data to object
      headers.forEach((header, index) => {
        userEntry[header] = row[index];
      });
      
      // Validate required fields
      if (!userEntry["User Name"] || !userEntry["User Name"].trim()) {
        throw new Error(`Row ${i}: User Name is required`);
      }
      
      if (!userEntry["Password"] || !userEntry["Password"].trim()) {
        throw new Error(`Row ${i}: Password is required`);
      }
      
      // Validate department
      const departmentExists = departments.some(
        dept => dept.name === userEntry["Department"] && dept.status === "Active"
      );
      
      if (!departmentExists) {
        throw new Error(`Row ${i}: Department "${userEntry["Department"]}" is not valid or not active`);
      }
      
      // Validate role
      if (!VALID_ROLES.includes(userEntry["Role"])) {
        throw new Error(`Row ${i}: Role "${userEntry["Role"]}" is not valid. Must be one of: ${VALID_ROLES.join(", ")}`);
      }
    }
  };

  const parseCSV = (text) => {
    const lines = text.split("\n").filter(line => line.trim() !== "");
    return lines.map(line => {
      // Simple CSV parsing (doesn't handle quoted fields with commas)
      return line.split(",").map(field => field.trim());
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setUploadStatus("error");
      setUploadMessage("Please upload a CSV file.");
      return;
    }

    setIsLoading(true);
    setUploadStatus(null);
    setUploadMessage("");

    try {
      const text = await file.text();
      const csvData = parseCSV(text);
      
      if (csvData.length < 2) {
        throw new Error("CSV file is empty or has no data rows");
      }
      
      // Validate data
      validateCSVData(csvData);
      
      // Extract user data (skip header row)
      const usersToUpload = [];
      const headers = csvData[0];
      
      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        const userEntry = {};
        
        headers.forEach((header, index) => {
          userEntry[header.toLowerCase().replace(" ", "_")] = row[index];
        });
        
        usersToUpload.push({
          name: userEntry.user_name,
          password: userEntry.password,
          department: userEntry.department,
          role: userEntry.role
        });
      }
      
      // Upload users
      const uploadResults = [];
      for (const userData of usersToUpload) {
        try {
          await axios.post(
            `${API_BASE_URL}/users`,
            userData,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
              },
            }
          );
          uploadResults.push({ success: true, user: userData.name });
        } catch (error) {
          console.error("Error uploading user:", error);
          uploadResults.push({ 
            success: false, 
            user: userData.name, 
            error: error.response?.data?.message || error.message 
          });
        }
      }
      
      // Calculate results
      const successfulUploads = uploadResults.filter(r => r.success).length;
      const failedUploads = uploadResults.filter(r => !r.success).length;
      
      if (failedUploads === 0) {
        setUploadStatus("success");
        setUploadMessage(`Successfully uploaded ${successfulUploads} users.`);
        fetchUsers(); // Refresh the user list
      } else if (successfulUploads === 0) {
        setUploadStatus("error");
        setUploadMessage(`Failed to upload any users. ${failedUploads} errors occurred.`);
      } else {
        setUploadStatus("error");
        setUploadMessage(
          `Partially successful: ${successfulUploads} users uploaded, ${failedUploads} failed.`
        );
      }
      
      // Log detailed results for troubleshooting
      console.log("Upload results:", uploadResults);
    } catch (error) {
      console.error("Error processing CSV:", error);
      setUploadStatus("error");
      setUploadMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    downloadUserTemplate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setTimeout(resetForm, 300); // Delay reset to allow dialog to close
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          BULK UPLOAD
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Users</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple users at once.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="csvFile" className="text-right">
              CSV File
            </Label>
            <div className="col-span-3">
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isLoading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50"
              />
              <p className="mt-2 text-sm text-gray-500">
                CSV format: User Name, Password, Department, Role
              </p>
            </div>
          </div>
          
          {uploadStatus && (
            <div className={`p-3 rounded ${uploadStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {uploadMessage}
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            <p className="font-medium mb-1">Requirements:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Department must exist in the system and be active</li>
              <li>Role must be one of: admin, maintenance, faculty/staff</li>
              <li>All fields are required</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            disabled={isLoading}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}