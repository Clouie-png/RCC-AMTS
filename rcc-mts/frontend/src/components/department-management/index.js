export { AddDepartmentDialog } from "./add-department-dialog";
export { AddDepartmentSuccessDialog } from "./add-department-success-dialog";
export { DeleteDepartmentDialog } from "./delete-department-dialog";
export { EditDepartmentDialog } from "./edit-department-dialog";
export { EditDepartmentSuccessDialog } from "./edit-department-success-dialog";

// Export the new export functionality
export { exportToCSV } from "@/lib/csv-utils";

export const exportDepartmentsToCSV = (departments, exportToCSV) => {
  // Define the headers for the CSV
  const headers = ["ID", "Name", "Location", "Head", "Status"];
  
  // Format the data
  const data = departments.map(dept => ({
    ID: `D-${String(dept.id).padStart(3, "0")}`,
    Name: dept.name,
    Location: dept.location,
    Head: dept.head,
    Status: dept.status
  }));
  
  // Export to CSV
  exportToCSV(data, "departments-export.csv", headers);
};