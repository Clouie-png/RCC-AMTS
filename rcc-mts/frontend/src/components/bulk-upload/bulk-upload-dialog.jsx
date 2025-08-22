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

const API_URL = "http://localhost:3001";

export function BulkUploadDialog({ 
  fetchItems, 
  entityName,
  templateHeaders,
  requiredFields,
  endpoint,
  validationRules = {},
  fieldMappings = {}
}) {
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
    
    for (const requiredField of requiredFields) {
      if (!headers.includes(requiredField)) {
        throw new Error(`Missing required column: ${requiredField}`);
      }
    }
    
    // Check each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const itemEntry = {};
      
      // Map row data to object
      headers.forEach((header, index) => {
        itemEntry[header] = row[index];
      });
      
      // Validate required fields
      for (const field of requiredFields) {
        if (!itemEntry[field] || !itemEntry[field].trim()) {
          throw new Error(`Row ${i}: ${field} is required`);
        }
      }
      
      // Apply custom validation rules
      for (const [field, rule] of Object.entries(validationRules)) {
        if (itemEntry[field] && typeof rule === 'function') {
          const validationResult = rule(itemEntry[field], itemEntry, i);
          if (validationResult !== true) {
            throw new Error(`Row ${i}: ${validationResult}`);
          }
        }
      }
    }
  };

  const parseCSV = (text) => {
    const lines = text.split("\n").filter(line => line.trim() !== "");
    return lines.map(line => {
      // Handle quoted fields that may contain commas
      const fields = [];
      let currentField = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && !inQuotes) {
          inQuotes = true;
        } else if (char === '"' && inQuotes) {
          // Check if it's an escaped quote
          if (i + 1 < line.length && line[i + 1] === '"') {
            currentField += '"';
            i++; // Skip next quote
          } else {
            inQuotes = false;
          }
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField.trim());
          currentField = "";
        } else {
          currentField += char;
        }
      }
      
      fields.push(currentField.trim());
      return fields;
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
      
      // Extract item data (skip header row)
      const itemsToUpload = [];
      const headers = csvData[0];
      
      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        const itemEntry = {};
        
        headers.forEach((header, index) => {
          // Apply field mappings if provided
          const mappedField = fieldMappings[header] || header.toLowerCase().replace(/\s+/g, '_');
          itemEntry[mappedField] = row[index];
        });
        
        itemsToUpload.push(itemEntry);
      }
      
      // Upload items
      const uploadResults = [];
      for (const itemData of itemsToUpload) {
        try {
          await axios.post(
            `${API_URL}/${endpoint}`,
            itemData,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
              },
            }
          );
          uploadResults.push({ success: true });
        } catch (error) {
          console.error(`Error uploading ${entityName}:`, error);
          uploadResults.push({ 
            success: false, 
            error: error.response?.data?.message || error.message 
          });
        }
      }
      
      // Calculate results
      const successfulUploads = uploadResults.filter(r => r.success).length;
      const failedUploads = uploadResults.filter(r => !r.success).length;
      
      if (failedUploads === 0) {
        setUploadStatus("success");
        setUploadMessage(`Successfully uploaded ${successfulUploads} ${entityName}.`);
        fetchItems(); // Refresh the list
      } else if (successfulUploads === 0) {
        setUploadStatus("error");
        setUploadMessage(`Failed to upload any ${entityName}. ${failedUploads} errors occurred.`);
      } else {
        setUploadStatus("error");
        setUploadMessage(
          `Partially successful: ${successfulUploads} ${entityName} uploaded, ${failedUploads} failed.`
        );
      }
      
      // Log detailed results for troubleshooting
      console.log("Upload results:", uploadResults);
    } catch (error) {
      console.error(`Error processing ${entityName} CSV:`, error);
      setUploadStatus("error");
      setUploadMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    let csvContent = templateHeaders.join(",") + "\n";
    // Add an example row if needed
    // csvContent += "Example Value 1,Example Value 2\n";
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${entityName}-template.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
          <DialogTitle>Bulk Upload {entityName}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple {entityName} at once.
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
                CSV format: {templateHeaders.join(", ")}
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
              {requiredFields.map((field, index) => (
                <li key={index}>Column "{field}" is required</li>
              ))}
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