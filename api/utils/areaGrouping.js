// utils/areaGrouping.js
export const getAreaGroup = (tableNumber) => {
    if (!tableNumber) return null;
    
    // Extract area code from table number (first character)
    const areaCode = tableNumber.charAt(0).toUpperCase();
    
    console.log(`🔍 Area grouping - Table: ${tableNumber}, Area Code: ${areaCode}`);
    
    // Konfigurasi area grouping sesuai dengan device BAR-001
    const areaGroups = {
        'A': 'group_1', 'B': 'group_1', 'C': 'group_1',
        'D': 'group_1', 'E': 'group_1', 'F': 'group_1', 
        'G': 'group_1', 'H': 'group_1', 'I': 'group_1',
        'J': 'group_2', 'K': 'group_2', 'L': 'group_2',
        'M': 'group_2', 'N': 'group_2', 'O': 'group_2'
    };
    
    const group = areaGroups[areaCode] || null;
    console.log(`📍 Area group for table ${tableNumber}: ${group}`);
    return group;
};