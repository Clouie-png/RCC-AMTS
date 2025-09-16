// Download a file with the specified content and filename
export const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Download CSV template for user uploads
export const downloadUserTemplate = () => {
  const csvContent = "User Name,Password,Department,Role\n";
  downloadFile(csvContent, "user-upload-template.csv", "text/csv;charset=utf-8;");
};

// Convert array of objects to CSV format
export const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) return "";
  
  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = csvHeaders.join(",");
  
  // Create data rows
  const rows = data.map(obj => {
    return csvHeaders.map(header => {
      const value = obj[header];
      // Handle values that might contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`; // Escape quotes
      }
      return value;
    }).join(",");
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join("\n");
};

// Export data to CSV file
export const exportToCSV = (data, filename, headers) => {
  const csvContent = convertToCSV(data, headers);
  if (csvContent) {
    downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
  }
};