const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

// AWS Client ইনিশিয়ালাইজ করা হচ্ছে
// আমরা Netlify-এর Environment Variables থেকে সিক্রেট কি-গুলো নেব যাতে কোড হ্যাক না হয়
const client = new BedrockRuntimeClient({
    region: process.env.MY_AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    },
});

exports.handler = async function(event, context) {
    // শুধুমাত্র POST রিকোয়েস্ট গ্রহণ করবে
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const userPrompt = body.prompt;

        // AWS Bedrock-এর জন্য Claude 3.5 Sonnet-এর পেলোড (Payload) স্ট্রাকচার
        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 2000,
            messages: [
                { role: "user", content: [{ type: "text", text: userPrompt }] }
            ]
        };

        const command = new InvokeModelCommand({
            modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0", // তোমার মডেল আইডি
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(payload),
        });

        // AWS-এ রিকোয়েস্ট পাঠানো হচ্ছে
        const response = await client.send(command);
        
        // রেসপন্স ডিকোড করা
        const responseData = JSON.parse(new TextDecoder().decode(response.body));
        const replyText = responseData.content[0].text;

        // সফল হলে ফ্রন্টএন্ডে ডেটা পাঠানো
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reply: replyText }),
        };

    } catch (error) {
        console.error("AWS Bedrock Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to connect to Claude AI. Check logs." }),
        };
    }
};
