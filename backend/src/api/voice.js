const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Site = require('../models/Site');
const Invoice = require('../models/Invoice');
const LedgerEntry = require('../models/LedgerEntry');

// Configure upload
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Clients
let groq;
let genAI;

try {
    if (process.env.GROQ_API_KEY) {
        console.log("Initializing Groq client...");
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    } else {
        console.warn("GROQ_API_KEY is missing in environment variables.");
    }

    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (err) {
    console.error("Error initializing AI clients:", err);
}

// Helper function to find site by name (fuzzy matching & aliases)
async function findSiteByName(siteName) {
    const sites = await Site.find({ status: 'Active' });
    const lowerSiteName = siteName.toLowerCase().replace(/[^a-z0-9]/g, ''); // Normalize input

    // Mapping for common mishearings / Hindi transliterations
    // Enhanced Mapping for "Moti Bhasha" & Whisper Hallucinations
    const SITE_ALIASES = {
        // --- Ajmera (Commonly heard as Azmira, Ejmira) ---
        'ejmira': 'Ajmera',
        'ezmira': 'Ajmera',
        'azmera': 'Ajmera',
        'azmira': 'Ajmera',
        'aajmera': 'Ajmera',
        'ajmer': 'Ajmera',
        'eximra': 'Ajmera',
        'ajmira': 'Ajmera',
        'ajmeera': 'Ajmera',
        'ajmara': 'Ajmera',
        'agmira': 'Ajmera',
        'ajmra': 'Ajmera',
        'zimeda': 'Ajmera',
        'jimeda': 'Ajmera',
        'zimada': 'Ajmera',
        'jhimeda': 'Ajmera',

        // --- Minerva (Commonly heard as Minarwa, Manarva) ---
        'minarva': 'Minerva',
        'minerva': 'Minerva',
        'manarva': 'Minerva',
        'menarva': 'Minerva',
        'minarwa': 'Minerva',
        'menarwa': 'Minerva',
        'mnarva': 'Minerva',
        'minalva': 'Minerva',
        'minerwa': 'Minerva',

        // --- Royal Eksar (Often just called Royal or Eksar) ---
        'royal': 'Royal Eksar',
        'eksar': 'Royal Eksar',
        'exar': 'Royal Eksar',
        'aksar': 'Royal Eksar',
        'axar': 'Royal Eksar',
        'royalexar': 'Royal Eksar',
        'royaleksar': 'Royal Eksar',
        'royl': 'Royal Eksar',

        // --- Ceejay (Heard as CJ, Seejay) ---
        'ceejay': 'Ceejay',
        'cj': 'Ceejay',
        'seejay': 'Ceejay',
        'sijay': 'Ceejay',
        'sjay': 'Ceejay',
        'cjay': 'Ceejay',
        'cije': 'Ceejay',
        'siejay': 'Ceejay',

        // --- Sanjay Puri (Often called Sanjay or Puri) ---
        'sanjay': 'Sanjay Puri',
        'puri': 'Sanjay Puri',
        'sanjaypuri': 'Sanjay Puri',
        'sjp': 'Sanjay Puri',
        'sanjypuri': 'Sanjay Puri',
        'snjay': 'Sanjay Puri',
        'sanjhu': 'Sanjay Puri',

        // --- Ruparel Elara (Heard as Ruprel, Alara, Elara) ---
        'ruparel': 'Ruparel Elara',
        'elara': 'Ruparel Elara',
        'ruprel': 'Ruparel Elara',
        'ruparal': 'Ruparel Elara',
        'alara': 'Ruparel Elara',
        'ilara': 'Ruparel Elara',
        'elera': 'Ruparel Elara',
        'ruparelelara': 'Ruparel Elara',

        // --- LKCPL (The abbreviations get messy) ---
        'lkcpl': 'LKCPL',
        'lk': 'LKCPL',
        'lkc': 'LKCPL',
        'lkpl': 'LKCPL',
        'elkcpl': 'LKCPL',
        'alkcpl': 'LKCPL',
        'lk_cpl': 'LKCPL',

        // --- Shreeya (Heard as Shriya, Shreya) ---
        'shreeya': 'Shreeya',
        'shriya': 'Shreeya',
        'shreya': 'Shreeya',
        'sriya': 'Shreeya',
        'shrea': 'Shreeya',
        'shria': 'Shreeya',
        'sria': 'Shreeya'
    };

    // Check aliases first
    for (const [alias, target] of Object.entries(SITE_ALIASES)) {
        if (lowerSiteName.includes(alias)) {
            return sites.find(s => s.name.toLowerCase() === target.toLowerCase());
        }
    }

    // Try exact & partial match
    let site = sites.find(s => s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerSiteName);
    if (!site) {
        site = sites.find(s =>
            s.name.toLowerCase().includes(lowerSiteName) ||
            lowerSiteName.includes(s.name.toLowerCase())
        );
    }
    return site;
}

router.post('/process', upload.single('audio'), async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'AI API keys (Groq/Gemini) missing in server environment.' });
        }

        if (!req.file) return res.status(400).json({ error: 'No audio provided' });

        console.log('Received audio file:', req.file.mimetype, req.file.size);

        // 1. Transcribe with Groq Whisper (Blazing Fast)
        let transcript = '';

        if (!groq) {
            console.error("Groq client not initialized (missing API Key).");
            return res.status(500).json({
                error: 'Server configuration error (Missing Groq Key).',
                transcript: '',
                response: 'System error. Check API keys.',
                audioBase64: null
            });
        }

        const tempFilePath = path.join(os.tmpdir(), `voice_upload_${Date.now()}.m4a`);

        try {
            fs.writeFileSync(tempFilePath, req.file.buffer);

            // Context prompt for Whisper to bias towards correct nouns
            const promptContext = "Ajmera, Minerva, Ruparel, Ceejay, LKCPL, Sanjay Puri, Shreeya, attendance, present, kaun aaya hai, hindi, hinglish";

            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-large-v3",
                prompt: promptContext,
                language: "hi",
                response_format: "json",
                temperature: 0.0
            });

            transcript = transcription.text;
            console.log('Groq Transcription:', transcript);

        } catch (error) {
            console.error("Groq Processing Error:", error);
            return res.status(500).json({
                error: 'Transcription failed: ' + error.message,
                transcript: '',
                response: 'Nakul here. Sir, I could not hear that properly.', // Persona: Nakul
                audioBase64: null
            });
        } finally {
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }

        if (!transcript) {
            return res.json({ transcript: "", response: "Nakul here. Sir, please say that again?", audioBase64: null });
        }

        let responseText = '';

        // 2. Advanced Intent Detection & Response Generation
        const lowerTranscript = transcript.toLowerCase();
        const today = new Date().toISOString().split('T')[0];

        // INTENT 1: Site-specific attendance
        const siteAttendancePatterns = [
            /(?:में|मे|mai|me)\s+(?:कौन|kaun|kon)/i, // Relaxed regex
            /(?:attendance|हाजिरी|haajiri|present)\s+(?:at|in|में|mai|of)/i,
            /(?:कौन|kaun|kon)\s+(?:कौन|kaun|kon)?\s*(?:है|hai|आया|aaya)/i,
            /(?:में|mein|mai|me)[?]?$/i,
            /(?:kya|kya)\s+(?:chal|raha|hai)/i
        ];

        let isAttendanceQuery = siteAttendancePatterns.some(pattern => pattern.test(transcript));

        // Check if any site ALIAS exists in the transcript directly
        let detectedSiteName = null;
        if (!detectedSiteName) {
            const words = lowerTranscript.replace(/[.,?]/g, '').split(/\s+/);
            const { SITE_ALIASES } = require('./voice.js');
            // Updated Aliases
            const aliases = {
                // --- Ajmera ---
                'ejmira': 'Ajmera', 'ezmira': 'Ajmera', 'azmera': 'Ajmera', 'azmira': 'Ajmera', 'aajmera': 'Ajmera', 'ajmer': 'Ajmera', 'eximra': 'Ajmera', 'ajmira': 'Ajmera', 'ajmeera': 'Ajmera', 'ajmara': 'Ajmera', 'agmira': 'Ajmera', 'ajmra': 'Ajmera', 'zimeda': 'Ajmera', 'jimeda': 'Ajmera', 'zimada': 'Ajmera', 'jhimeda': 'Ajmera',

                // --- Minerva ---
                'minarva': 'Minerva', 'minerva': 'Minerva', 'manarva': 'Minerva', 'menarva': 'Minerva', 'minarwa': 'Minerva', 'menarwa': 'Minerva', 'mnarva': 'Minerva', 'minalva': 'Minerva', 'minerwa': 'Minerva',

                // --- Royal Eksar ---
                'royal': 'Royal Eksar', 'eksar': 'Royal Eksar', 'exar': 'Royal Eksar', 'aksar': 'Royal Eksar', 'axar': 'Royal Eksar', 'royalexar': 'Royal Eksar', 'royaleksar': 'Royal Eksar', 'royl': 'Royal Eksar',

                // --- Ceejay ---
                'ceejay': 'Ceejay', 'cj': 'Ceejay', 'seejay': 'Ceejay', 'sijay': 'Ceejay', 'sjay': 'Ceejay', 'cjay': 'Ceejay', 'cije': 'Ceejay', 'siejay': 'Ceejay',

                // --- Sanjay Puri ---
                'sanjay': 'Sanjay Puri', 'puri': 'Sanjay Puri', 'sanjaypuri': 'Sanjay Puri', 'sjp': 'Sanjay Puri', 'sanjypuri': 'Sanjay Puri', 'snjay': 'Sanjay Puri', 'sanjhu': 'Sanjay Puri',

                // --- Ruparel Elara ---
                'ruparel': 'Ruparel Elara', 'elara': 'Ruparel Elara', 'ruprel': 'Ruparel Elara', 'ruparal': 'Ruparel Elara', 'alara': 'Ruparel Elara', 'ilara': 'Ruparel Elara', 'elera': 'Ruparel Elara', 'ruparelelara': 'Ruparel Elara',

                // --- LKCPL ---
                'lkcpl': 'LKCPL', 'lk': 'LKCPL', 'lkc': 'LKCPL', 'lkpl': 'LKCPL', 'elkcpl': 'LKCPL', 'alkcpl': 'LKCPL', 'lk_cpl': 'LKCPL',

                // --- Shreeya ---
                'shreeya': 'Shreeya', 'shriya': 'Shreeya', 'shreya': 'Shreeya', 'sriya': 'Shreeya', 'shrea': 'Shreeya', 'shria': 'Shreeya', 'sria': 'Shreeya'
            };

            for (const word of words) {
                for (const [alias, target] of Object.entries(aliases)) {
                    if (word.includes(alias)) {
                        detectedSiteName = alias;
                        isAttendanceQuery = true;
                        break;
                    }
                }
                if (detectedSiteName) break;
            }
        }

        if (isAttendanceQuery) {
            // If we found a name via alias scan, use it. Otherwise try extraction relative to "me/in"
            let siteName = detectedSiteName;

            if (!siteName) {
                const words = transcript.split(/\s+/);
                // Look for words before "में" or "mai"
                for (let i = 0; i < words.length; i++) {
                    if (['में', 'मे', 'mai', 'me', 'at', 'in'].includes(words[i].toLowerCase())) {
                        if (i > 0) {
                            siteName = words[i - 1];
                            break;
                        }
                    }
                }
            }

            // Fallback: search entire transcript against DB sites
            if (!siteName) siteName = transcript;

            if (siteName) {
                const site = await findSiteByName(siteName);

                if (site) {
                    const allEmployees = await Employee.find({ siteId: site.id, status: 'Active' });

                    if (allEmployees.length === 0) {
                        responseText = `Sir, ${site.name} par koi active employee nahi hai.`;
                    } else {
                        const attendances = await Attendance.find({ siteId: site.id, date: today });

                        const attendanceMap = {};
                        attendances.forEach(att => attendanceMap[att.employeeId] = att);

                        const presentWithPhoto = [];
                        const presentManual = [];
                        const noRecord = [];

                        allEmployees.forEach(emp => {
                            const att = attendanceMap[emp.id];
                            if (att && att.status === 'P') {
                                if (att.photoUrl && att.photoUrl.trim() !== '') presentWithPhoto.push(emp.name);
                                else presentManual.push(emp.name);
                            } else {
                                noRecord.push(emp.name);
                            }
                        });

                        // Nakul Persona Response
                        const parts = [];
                        if (presentWithPhoto.length > 0 || presentManual.length > 0) {
                            parts.push(`Sir, aaj ${site.name} par`);
                            const presentParts = [];
                            if (presentWithPhoto.length > 0) presentParts.push(`${presentWithPhoto.join(', ')} ne photo bheja hai`);
                            if (presentManual.length > 0) presentParts.push(`${presentManual.join(', ')} ki attendance mark ho gayi hai`);
                            parts.push(presentParts.join(' aur ') + ".");
                        } else {
                            parts.push(`Sir, aaj ${site.name} par abhi tak kisi ki attendance nahi aayi hai.`);
                        }

                        if (noRecord.length > 0) {
                            parts.push(`${noRecord.length} log pending hain: ${noRecord.join(', ')}.`);
                        }

                        responseText = parts.join(' ');
                    }
                } else {
                    // If purely an attendance query but site not found, ask specifically
                    if (detectedSiteName) responseText = `Sir, ${detectedSiteName} site database mai nahi mili.`;
                    else responseText = "Nakul here, Sir. Kaunsi site ki report chahiye?";
                }
            }
        }
        // INTENT 2: Total attendance
        else if (lowerTranscript.includes('how many') || lowerTranscript.includes('kitne') || lowerTranscript.includes('total')) {
            const count = await Attendance.countDocuments({ date: today, status: 'P' });
            responseText = `Sir, total ${count} log aaj present hain sabhi sites par.`;
        }
        // INTENT 3: Pending Bills
        else if (lowerTranscript.includes('bill') || lowerTranscript.includes('invoice') || lowerTranscript.includes('बिल')) {
            const pendingInvoices = await Invoice.find({
                status: { $in: ['Unpaid', 'Pending Payment', 'Pending Approval'] }
            }).sort({ dueDate: 1 }).limit(5);

            if (pendingInvoices.length === 0) {
                responseText = "Sir, koi pending bill nahi hai. Sab clear hai.";
            } else {
                const totalAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
                responseText = `Sir, ${pendingInvoices.length} bill pending hain, total ₹${totalAmount}. Process kar dun?`;
            }
        }
        // INTENT 4: Advances
        else if (lowerTranscript.includes('advance') || lowerTranscript.includes('एडवांस') || lowerTranscript.includes('ledger')) {
            const pendingEntries = await LedgerEntry.find({ status: 'Pending' }).limit(5);
            if (pendingEntries.length === 0) {
                responseText = "Sir, ledger mein koi pending advance nahi hai.";
            } else {
                responseText = `Sir, ${pendingEntries.length} advance requests pending hain check karne ke liye.`;
            }
        }
        // FALLBACK: Gemini (Nakul Persona)
        else {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                const context = `
                You are Nakul, the personal Assistant (PA) and Accountant for Hari Sir (the Boss).
                You work at Ambe Services (Construction Company).
                Traits: Efficient, loyal, direct, uses "Sir" respectfully but speaks quickly.
                Language: Mix of Hindi and English (Hinglish).
                Context: Hari Sir is asking you a question via voice.
                Task: Answer strictly in 1-2 sentences. Do not be vague. If you don't know, ask for clarification instantly.
                CRITICAL RULE: DO NOT INVENT INFORMATION. If asked about site status/attendance and you do not have the data in this context, say "Sir, mere paas is site ka data abhi nahi hai" or "Sir, site ka naam samajh nahi aaya". 
                User said: "${transcript}"
                `;

                const result = await model.generateContent(context);
                const response = await result.response;
                responseText = response.text();
            } catch (aiError) {
                console.error("Gemini Error:", aiError.message);
                responseText = "Sir, network glitch. Please repeat.";
            }
            responseText = responseText ? responseText.replace(/\*/g, '') : "System online.";
        }

        console.log('AI Response:', responseText);

        // 3. Text to Speech (Edge TTS) - Robust Streaming
        try {
            const tts = new MsEdgeTTS();
            await tts.setMetadata("hi-IN-MadhurNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

            const streamResult = await tts.toStream(responseText);
            const readable = streamResult.audioStream;

            const chunks = [];

            readable.on('data', (chunk) => {
                chunks.push(chunk);
            });

            readable.on('end', () => {
                if (chunks.length === 0) {
                    console.error("TTS Stream ended with 0 bytes.");
                    res.json({ transcript, response: responseText, audioBase64: null });
                    return;
                }
                const audioBuffer = Buffer.concat(chunks);
                const audioBase64 = audioBuffer.toString('base64');
                console.log(`TTS Generated. Buffer size: ${audioBuffer.length} bytes`);

                res.json({
                    transcript: transcript,
                    response: responseText,
                    audioBase64: audioBase64
                });
            });

            readable.on('error', (err) => {
                console.error("TTS Stream Error:", err);
                res.json({ transcript, response: responseText, audioBase64: null });
            });

        } catch (ttsError) {
            console.error("TTS Error:", ttsError);
            res.json({
                transcript: transcript,
                response: responseText,
                audioBase64: null
            });
        }

    } catch (e) {
        console.error('Voice processing error:', e);
        if (!res.headersSent) res.status(500).json({ error: e.message });
    }
});

module.exports = router;
