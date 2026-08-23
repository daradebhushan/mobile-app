const mysql = require('mysql2/promise');

async function run() {
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3307,
            user: 'nagar_prod',
            password: 'ProdPass@456',
            database: 'nagar_parishad_db_prod'
        });
        const [rows] = await connection.execute("SELECT conf_value FROM chatbot_config WHERE conf_key='META_API_TOKEN'");
        if(rows.length > 0) {
            console.log("Token found!");
            const token = rows[0].conf_value;
            // Now fetch phone numbers using WABA ID
            const wabaId = '913348971765318';
            const url = `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${token}`;
            const response = await fetch(url);
            const data = await response.json();
            console.log("Phone numbers:", JSON.stringify(data, null, 2));
            
            if (data.data) {
                const targetNumber = data.data.find(n => n.display_phone_number.includes('84598') || n.display_phone_number.includes('81702'));
                if (targetNumber) {
                    console.log(`Found target number ID: ${targetNumber.id}, Status: ${targetNumber.status}`);
                    // Register it
                    const regUrl = `https://graph.facebook.com/v20.0/${targetNumber.id}/register`;
                    const regRes = await fetch(regUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            messaging_product: 'whatsapp',
                            pin: '123456'
                        })
                    });
                    const regData = await regRes.json();
                    console.log("Registration Response:", JSON.stringify(regData, null, 2));
                } else {
                    console.log("Target number not found in API response.");
                }
            }
        } else {
            console.log("No token found in DB.");
        }
        await connection.end();
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
