export const getAreaGroup = (areaCode) => {
        if (!areaCode) return null;
        
        // Konfigurasi area grouping sesuai dengan device BAR-001
        const areaGroups = {
            'A': 'group_1', 'B': 'group_1', 'C': 'group_1',
            'D': 'group_1', 'E': 'group_1', 'F': 'group_1', 
            'G': 'group_1', 'H': 'group_1', 'I': 'group_1',
            'J': 'group_2', 'K': 'group_2', 'L': 'group_2',
            'M': 'group_2', 'N': 'group_2', 'O': 'group_2'
        };
        
        return areaGroups[areaCode] || null;
    };
