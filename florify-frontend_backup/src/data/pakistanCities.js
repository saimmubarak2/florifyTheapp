// List of major cities in Pakistan for the garden location dropdown
export const PAKISTAN_CITIES = [
  // Punjab
  { value: 'Lahore', label: 'Lahore', province: 'Punjab' },
  { value: 'Faisalabad', label: 'Faisalabad', province: 'Punjab' },
  { value: 'Rawalpindi', label: 'Rawalpindi', province: 'Punjab' },
  { value: 'Multan', label: 'Multan', province: 'Punjab' },
  { value: 'Gujranwala', label: 'Gujranwala', province: 'Punjab' },
  { value: 'Sialkot', label: 'Sialkot', province: 'Punjab' },
  { value: 'Bahawalpur', label: 'Bahawalpur', province: 'Punjab' },
  { value: 'Sargodha', label: 'Sargodha', province: 'Punjab' },
  { value: 'Sheikhupura', label: 'Sheikhupura', province: 'Punjab' },
  { value: 'Jhang', label: 'Jhang', province: 'Punjab' },
  { value: 'Rahim Yar Khan', label: 'Rahim Yar Khan', province: 'Punjab' },
  { value: 'Kasur', label: 'Kasur', province: 'Punjab' },
  { value: 'Gujrat', label: 'Gujrat', province: 'Punjab' },
  { value: 'Okara', label: 'Okara', province: 'Punjab' },
  { value: 'Sahiwal', label: 'Sahiwal', province: 'Punjab' },
  { value: 'Dera Ghazi Khan', label: 'Dera Ghazi Khan', province: 'Punjab' },
  { value: 'Jhelum', label: 'Jhelum', province: 'Punjab' },
  { value: 'Chiniot', label: 'Chiniot', province: 'Punjab' },

  // Sindh
  { value: 'Karachi', label: 'Karachi', province: 'Sindh' },
  { value: 'Hyderabad', label: 'Hyderabad', province: 'Sindh' },
  { value: 'Sukkur', label: 'Sukkur', province: 'Sindh' },
  { value: 'Larkana', label: 'Larkana', province: 'Sindh' },
  { value: 'Nawabshah', label: 'Nawabshah', province: 'Sindh' },
  { value: 'Mirpur Khas', label: 'Mirpur Khas', province: 'Sindh' },
  { value: 'Jacobabad', label: 'Jacobabad', province: 'Sindh' },
  { value: 'Shikarpur', label: 'Shikarpur', province: 'Sindh' },
  { value: 'Khairpur', label: 'Khairpur', province: 'Sindh' },

  // Khyber Pakhtunkhwa
  { value: 'Peshawar', label: 'Peshawar', province: 'Khyber Pakhtunkhwa' },
  { value: 'Mardan', label: 'Mardan', province: 'Khyber Pakhtunkhwa' },
  { value: 'Abbottabad', label: 'Abbottabad', province: 'Khyber Pakhtunkhwa' },
  { value: 'Mingora', label: 'Mingora', province: 'Khyber Pakhtunkhwa' },
  { value: 'Kohat', label: 'Kohat', province: 'Khyber Pakhtunkhwa' },
  { value: 'Dera Ismail Khan', label: 'Dera Ismail Khan', province: 'Khyber Pakhtunkhwa' },
  { value: 'Bannu', label: 'Bannu', province: 'Khyber Pakhtunkhwa' },
  { value: 'Swabi', label: 'Swabi', province: 'Khyber Pakhtunkhwa' },
  { value: 'Nowshera', label: 'Nowshera', province: 'Khyber Pakhtunkhwa' },
  { value: 'Charsadda', label: 'Charsadda', province: 'Khyber Pakhtunkhwa' },
  { value: 'Mansehra', label: 'Mansehra', province: 'Khyber Pakhtunkhwa' },

  // Balochistan
  { value: 'Quetta', label: 'Quetta', province: 'Balochistan' },
  { value: 'Turbat', label: 'Turbat', province: 'Balochistan' },
  { value: 'Khuzdar', label: 'Khuzdar', province: 'Balochistan' },
  { value: 'Hub', label: 'Hub', province: 'Balochistan' },
  { value: 'Chaman', label: 'Chaman', province: 'Balochistan' },
  { value: 'Gwadar', label: 'Gwadar', province: 'Balochistan' },
  { value: 'Zhob', label: 'Zhob', province: 'Balochistan' },
  { value: 'Sibi', label: 'Sibi', province: 'Balochistan' },

  // Federal Capital
  { value: 'Islamabad', label: 'Islamabad', province: 'Federal Capital' },

  // Azad Kashmir
  { value: 'Muzaffarabad', label: 'Muzaffarabad', province: 'Azad Kashmir' },
  { value: 'Mirpur', label: 'Mirpur', province: 'Azad Kashmir' },
  { value: 'Kotli', label: 'Kotli', province: 'Azad Kashmir' },
  { value: 'Rawalakot', label: 'Rawalakot', province: 'Azad Kashmir' },

  // Gilgit-Baltistan
  { value: 'Gilgit', label: 'Gilgit', province: 'Gilgit-Baltistan' },
  { value: 'Skardu', label: 'Skardu', province: 'Gilgit-Baltistan' },
  { value: 'Hunza', label: 'Hunza', province: 'Gilgit-Baltistan' },
  { value: 'Chilas', label: 'Chilas', province: 'Gilgit-Baltistan' },
].sort((a, b) => a.label.localeCompare(b.label));

// Get cities by province
export const getCitiesByProvince = (province) => {
  return PAKISTAN_CITIES.filter(city => city.province === province);
};

// Get all unique provinces
export const getProvinces = () => {
  return [...new Set(PAKISTAN_CITIES.map(city => city.province))];
};
