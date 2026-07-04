// AST script to extract Database Schema models & relations
const fs = require('fs');
const path = require('path');

function extractSchemaInfo(schemaPath) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const models = [];
    const enums = [];
    
    // Quick regex parsing for models
    const modelRegex = /model\s+(\w+)\s+{([^}]+)}/g;
    let match;
    
    while ((match = modelRegex.exec(schemaContent)) !== null) {
        const modelName = match[1];
        const body = match[2];
        const fields = [];
        const relations = [];
        
        const lines = body.split('\n');
        for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.length === 0 || cleanLine.startsWith('//') || cleanLine.startsWith('@@')) continue;
            
            const parts = cleanLine.split(/\s+/);
            if (parts.length >= 2) {
                const fieldName = parts[0];
                const fieldType = parts[1];
                fields.push({ name: fieldName, type: fieldType });
                
                if (cleanLine.includes('@relation')) {
                    relations.push(fieldName);
                }
            }
        }
        
        models.push({
            name: modelName,
            fieldCount: fields.length,
            relations: relations
        });
    }

    // Quick regex parsing for enums
    const enumRegex = /enum\s+(\w+)\s+{([^}]+)}/g;
    while ((match = enumRegex.exec(schemaContent)) !== null) {
        const enumName = match[1];
        const body = match[2];
        const values = body.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('//'));
        
        enums.push({ name: enumName, values });
    }
    
    return { models, enums };
}

try {
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    const info = extractSchemaInfo(schemaPath);
    
    const outputPath = path.join(__dirname, '..', 'docs', 'schema_inventory.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(info, null, 2));
    
    console.log(`Schema extraction complete. Found ${info.models.length} models and ${info.enums.length} enums.`);
} catch (error) {
    console.error("Error extracting schema:", error);
}
