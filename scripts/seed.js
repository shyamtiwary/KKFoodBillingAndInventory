// Using native fetch in Node.js 20+

// Actually, modern node has fetch.

const PRODUCTS_API = 'http://localhost:55219/api/Products';

const products = [
    {
        name: 'Kaju',
        category: 'FMCG',
        costPrice: 1000,
        sellPrice: 1200,
        stock: 20,
        sku: 'WM-001',
        lowStockThreshold: 10,
    },
    {
        name: 'Mechanical Keyboard',
        category: 'Electronics',
        costPrice: 50,
        sellPrice: 89.99,
        stock: 8,
        sku: 'KB-002',
        lowStockThreshold: 10,
    },
    {
        name: 'USB-C Cable',
        category: 'Accessories',
        costPrice: 5,
        sellPrice: 12.99,
        stock: 5,
        sku: 'CB-003',
        lowStockThreshold: 15,
    },
    {
        name: 'Laptop Stand',
        category: 'Accessories',
        costPrice: 20,
        sellPrice: 45.99,
        stock: 67,
        sku: 'LS-004',
        lowStockThreshold: 10,
    }
];

async function seed() {
    console.log('Seeding products...');
    for (const product of products) {
        try {
            const response = await fetch(PRODUCTS_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(product),
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`Created product: ${data.name} (ID: ${data.id})`);
            } else {
                console.error(`Failed to create product ${product.name}: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error(text);
            }
        } catch (error) {
            console.error(`Error creating product ${product.name}:`, error);
        }
    }
    console.log('Seeding complete.');
}

seed();
