export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    return res.status(200).json({ model });
}
