import { useMemo } from 'react';

export const useTicketFilters = ({
  categories = [],
  subCategories = [],
  assets = [],
  pcParts = [],
  users = [],
  selectedDepartmentId,
  selectedCategoryId
}) => {
  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) return [];
    if (!selectedDepartmentId) return categories;
    return categories.filter(
      (cat) => cat.department_id?.toString() === selectedDepartmentId
    );
  }, [categories, selectedDepartmentId]);

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
    if (!selectedDepartmentId) return assets;
    
    // Create a set of sub-category IDs that belong to the selected department
    const subCategoryIdsInDepartment = new Set(
      subCategories
        .filter(sc => sc.category_id && categories.some(c => 
          c.id === sc.category_id && c.department_id?.toString() === selectedDepartmentId
        ))
        .map(sc => sc.id)
    );
    
    // Filter assets that belong to sub-categories in the selected department
    return assets.filter(
      (asset) => asset.sub_category_id && subCategoryIdsInDepartment.has(asset.sub_category_id)
    );
  }, [assets, subCategories, categories, selectedDepartmentId]);

  const filteredPcParts = useMemo(() => {
    if (!Array.isArray(pcParts) || pcParts.length === 0) return [];
    if (!selectedDepartmentId) return pcParts;
    return pcParts.filter(
      (pcPart) => pcPart.department_id?.toString() === selectedDepartmentId
    );
  }, [pcParts, selectedDepartmentId]);

  const facultyStaffUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    return users.filter(user => user.role === 'faculty/staff');
  }, [users]);

  const maintenanceUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
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