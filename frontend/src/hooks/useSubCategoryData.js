import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export const useSubCategoryData = (selectedSubCategoryId, selectedDepartmentId, subCategories) => {
  const { user } = useAuth();
  const [pcParts, setPcParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPcPartsBySubCategory = useCallback(async () => {
    if (!user?.token || !selectedSubCategoryId || !selectedDepartmentId) {
      setPcParts([]);
      return;
    }

    // Check if the selected sub-category is "PC Unit"
    const isPcUnit = subCategories?.some(
      (subCat) =>
        subCat.name === "PC Unit" &&
        subCat.id?.toString() === selectedSubCategoryId
    );

    if (!isPcUnit) {
      setPcParts([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch PC units for the selected department
      const response = await axios.get(`${API_BASE_URL}/pc-parts`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // Filter PC units by department
      const filteredPcParts = response.data.filter(
        (pcPart) => pcPart.department_id?.toString() === selectedDepartmentId
      );

      setPcParts(filteredPcParts);
    } catch (err) {
      console.error('Error fetching PC units:', err);
      setError('Failed to fetch PC units');
      setPcParts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.token, selectedSubCategoryId, selectedDepartmentId, subCategories]);

  useEffect(() => {
    fetchPcPartsBySubCategory();
  }, [fetchPcPartsBySubCategory]);

  return {
    pcParts,
    loading,
    error,
    refetch: fetchPcPartsBySubCategory
  };
};