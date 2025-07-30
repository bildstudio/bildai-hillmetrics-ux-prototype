export function getInitials(fullName: string): string {
  if (!fullName || fullName.trim().length === 0) {
    return "?";
  }

  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    // Ako postoji samo jedno ime, uzmi prva dva slova
    const name = nameParts[0];
    return name.length >= 2 
      ? name.substring(0, 2).toUpperCase()
      : name.toUpperCase();
  }
  
  // Uzmi prvo slovo imena i prvo slovo prezimena
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Gmail-style paleta boja
const gmailColors = [
  '#1a73e8', // Blue
  '#e52592', // Pink
  '#0f9d58', // Green
  '#ff6d00', // Orange
  '#673ab7', // Purple
  '#00bcd4', // Cyan
  '#ff5722', // Deep Orange
  '#009688', // Teal
  '#795548', // Brown
  '#607d8b', // Blue Grey
  '#f44336', // Red
  '#4caf50', // Light Green
  '#2196f3', // Light Blue
  '#ffeb3b', // Yellow (darker for better contrast)
  '#9c27b0', // Deep Purple
  '#3f51b5', // Indigo
];

export function getAvatarColor(name: string): string {
  if (!name || name.trim().length === 0) {
    return gmailColors[0];
  }

  // Generiši hash od imena
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Koristi hash da izabereš boju
  const index = Math.abs(hash) % gmailColors.length;
  return gmailColors[index];
}

export function generateAvatarProps(fullName: string, email?: string) {
  const displayName = fullName || email?.split('@')[0] || 'User';
  const initials = getInitials(displayName);
  const backgroundColor = getAvatarColor(displayName);
  
  return {
    initials,
    backgroundColor,
    textColor: '#ffffff', // Beli tekst za sve pozadinske boje
  };
}