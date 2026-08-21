import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { SpeechToTextFactory } from '../integrations/speech/SpeechToTextProvider.js';
import { AIFactory } from '../integrations/ai/AIProvider.js';
import { emitEvent } from '../sockets/socketHandler.js';

export async function getCalls(req: Request, res: Response) {
  try {
    const calls = await prisma.call.findMany({
      include: { citizen: true },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = calls.map(c => ({
      id: c.callNumber,
      phone: c.citizen?.phone || c.phoneMasked,
      language: c.language,
      duration: c.duration,
      status: c.status === 'ACTIVE' ? 'AI Analyzing' : c.status === 'EMERGENCY' ? 'CRITICAL ALERT' : 'Queued',
      aiConfidence: 96,
      priority: c.status === 'EMERGENCY' ? 'Critical' : 'High',
      location: 'Anna Nagar',
      rawTranscript: c.transcript || 'எங்கள் பகுதியில் மூன்று நாட்களாக தண்ணீர் வரவில்லை...',
      englishTranscript: 'No water supply reported for three consecutive days in Anna Nagar affecting 20+ households...',
      aiCategory: 'Water Supply',
      aiDept: 'Water Board',
      sentiment: c.status === 'EMERGENCY' ? 'Panicked' : 'Frustrated',
      emergency: c.status === 'EMERGENCY',
      summary: 'No water supply reported for three consecutive days affecting multiple households.'
    }));

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function processAudioTranscription(req: Request, res: Response) {
  try {
    const file = req.file;
    const bodyText = req.body?.text || '';

    const stt = SpeechToTextFactory.getProvider();
    const result = await stt.transcribeAudio(file ? file.buffer : 'audio_sample.wav');

    const inputForAi = bodyText ? `${bodyText}. Transcribed audio: "${result.transcript}"` : result.transcript;

    const ai = AIFactory.getProvider();
    const analysis = await ai.analyzeComplaint(inputForAi);

    emitEvent('call:transcription', { result, analysis });

    return res.json({
      success: true,
      data: {
        sttResult: result,
        aiAnalysis: analysis
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
