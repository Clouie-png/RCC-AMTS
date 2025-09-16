import { useMemo } from 'react';

export const useTicketFilters = ({
  categories = [],
  subCategories = [],
  assets = [],
  pcParts = [],
  users = [],
  departments = [],
  selectedDepartmentId,
  selectedCategoryId,
  selectedAssetId
}) => {
  const filteredCategories = useMemo(() => {
    // Categories are independent of departments, so return all categories
    return categories;
  }, [categories]);

  const filteredSubCategories = useMemo(() => {
    if (!Array.isArray(subCategories) || subCategories.length === 0) return [];
    if (!selectedCategoryId) return subCategories;
    return subCategories.filter(
      (subCat) => subCat.category_id?.toString() === selectedCategoryId
    );
  }, [subCategories, selectedCategoryId]);

  const filteredAssets = useMemo(() => {
    if (!Array.isArray(assets) || assets.length === 0) return [];
    if (!Array.isArray(subCategories) || subCategories.length === 0) return [];
    
    // Since categories are independent of departments, we can't filter assets by department
    // through the category->subcategory chain. Assets have their own department_id.
    if (selectedDepartmentId) {
      return assets.filter(
        (asset) => asset.department_id?.toString() === selectedDepartmentId
      );
    }
    
    return assets;
  }, [assets, selectedDepartmentId]);

  const filteredPcParts = useMemo(() => {
    if (!Array.isArray(pcParts) || pcParts.length === 0) return [];
    
    // If an asset is selected, filter PC parts by that asset's item_code
    if (selectedAssetId) {
      const selectedAsset = assets.find(asset => asset.id?.toString() === selectedAssetId);
      if (selectedAsset) {
        return pcParts.filter(
          (pcPart) => pcPart.asset_item_code === selectedAsset.item_code
        );
      }
      return [];
    }
    
    // If no asset is selected but a department is selected, filter by department
    if (selectedDepartmentId) {
      return pcParts.filter(
        (pcPart) => pcPart.department_id?.toString() === selectedDepartmentId
      );
    }
    
    // If neither asset nor department is selected, return all PC parts
    return pcParts;
  }, [pcParts, selectedAssetId, assets, selectedDepartmentId]);

  const facultyStaffUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    if (!selectedDepartmentId) return users.filter(user => user.role === 'faculty/staff');
    
    // Find the department name that matches the selected ID
    const selectedDepartment = departments.find(dept => dept.id?.toString() === selectedDepartmentId);
    if (!selectedDepartment) return [];
    
    return users.filter(user => 
      user.role === 'faculty/staff' && 
      user.department === selectedDepartment.name
    );
  }, [users, selectedDepartmentId, departments]);

  const maintenanceUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    // Return all maintenance users regardless of department
    return users.filter(user => user.role === 'maintenance');
  }, [users]);

  return {
    filteredCategories,
    filteredSubCategories,
    filteredAssets,
    filteredPcParts,
    facultyStaffUsers,
    maintenanceUsers
  };
};