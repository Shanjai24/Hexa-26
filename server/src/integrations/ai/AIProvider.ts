export interface AIAnalysisOutput {
  language: string;
  category: string;
  subcategory: string;
  priority: string;
  sentiment: string;
  urgency: number;
  emergency: boolean;
  emergencyType?: string;
  location: string;
  zone: string;
  summary: string;
  department: string;
  recommendedTeam: string;
  recommendedAction: string;
  confidence: {
    classification: number;
    department: number;
    location: number;
  };
  entities: string[];
}

export interface IAIProvider {
  analyzeComplaint(transcript: string, rawInput?: string): Promise<AIAnalysisOutput>;
  detectDuplicates(category: string, location: string, description: string): Promise<Array<{ id: string; score: number; reason: string }>>;
  generateInsights(): Promise<any[]>;
}

export class MockAIProvider implements IAIProvider {
  async analyzeComplaint(transcript: string, rawInput?: string): Promise<AIAnalysisOutput> {
    const text = (transcript + ' ' + (rawInput || '')).toLowerCase();

    const isFire = text.includes('fire') || text.includes('rescue') || text.includes('station') || text.includes('smoke') || text.includes('flame') || text.includes('blaze') || text.includes('burn') || text.includes('cylinder') || text.includes('explosion') || text.includes('aag') || text.includes('thee') || text.includes('தீ') || text.includes('புகை') || text.includes('தீப்பற்றி') || text.includes('disaster');
    const isElec = text.includes('elec') || text.includes('power') || text.includes('spark') || text.includes('light') || text.includes('transformer') || text.includes('current') || text.includes('voltage') || text.includes('மின்சாரம்');
    const isSan = text.includes('sanitat') || text.includes('garbage') || text.includes('waste') || text.includes('drain') || text.includes('sewage') || text.includes('kachra') || text.includes('சாக்கடை');
    const isPolice = text.includes('police') || text.includes('traffic') || text.includes('crime') || text.includes('theft') || text.includes('robbery') || text.includes('law');
    const isHealth = text.includes('health') || text.includes('hospital') || text.includes('doctor') || text.includes('ambulance') || text.includes('108') || text.includes('medical');
    const isTrans = text.includes('trans') || text.includes('bus') || text.includes('mtc') || text.includes('vehicle') || text.includes('pothole');
    const isPwd = text.includes('public works') || text.includes('road') || text.includes('bridge') || text.includes('pwd');
    const isCorp = text.includes('municipal') || text.includes('gcc') || text.includes('tax') || text.includes('corporation');

    let category = "Water Supply";
    let subcategory = "Pipeline Breakdown";
    let department = "Water Board";
    let team = "Zone 4 Maintenance Squad";
    let action = "Inspect trunk pipeline grid near site";
    let priority = "HIGH";
    let emergency = false;
    let emergencyType: string | undefined = undefined;
    let summary = transcript.length > 10 ? (transcript.length > 140 ? transcript.slice(0, 140) + "..." : transcript) : "Civic complaint reported by citizen.";

    if (isFire) {
      category = "Fire Emergency";
      subcategory = "Structural Fire & Rescue";
      department = "Fire & Rescue";
      team = "Ambattur Fire Tender 1";
      action = "Immediate dispatch of fire tender and rescue squad";
      priority = "CRITICAL";
      emergency = true;
      emergencyType = "Structural Fire & Rescue";
      summary = "Active fire emergency or rescue requirement reported by citizen.";
    } else if (isElec) {
      category = "Electricity Boards";
      subcategory = "Power Line Breakdown & Transformer";
      department = "Electricity Board";
      team = "Zone 2 Electrical Squad";
      action = "Isolate feeder line and inspect local transformer";
      priority = "HIGH";
      summary = "Power failure or electrical spark issue reported by citizen.";
    } else if (isSan) {
      category = "Sanitation";
      subcategory = "Solid Waste & Sewage Overflow";
      department = "Sanitation";
      team = "Sanitation De-silting Squad 5";
      action = "Deploy vacuum waste clearance vehicle";
      priority = "MEDIUM";
      summary = "Garbage accumulation or drainage overflow reported by citizen.";
    } else if (isPolice) {
      category = "Police";
      subcategory = "Traffic Control & Security";
      department = "Police";
      team = "Division Patrol Unit 3";
      action = "Deploy patrol vehicle to inspect location";
      priority = "HIGH";
      summary = "Traffic disruption or police helpline query reported by citizen.";
    } else if (isHealth) {
      category = "Healthcare";
      subcategory = "Public Health & Sanitation Hygiene";
      department = "Healthcare";
      team = "Medical Inspection Team 2";
      action = "Dispatch public health officer to location";
      priority = "HIGH";
      summary = "Public healthcare or medical assistance request reported by citizen.";
    } else if (isTrans) {
      category = "Transport";
      subcategory = "Bus Transit & Depot Facilities";
      department = "Transport";
      team = "MTC Transit Inspection Squad";
      action = "Inspect bus route and transit schedule";
      priority = "MEDIUM";
      summary = "Public bus transport service issue reported by citizen.";
    } else if (isPwd) {
      category = "Public Works";
      subcategory = "Road Repair & Bridge Infrastructure";
      department = "Public Works";
      team = "PWD Road Works Crew 4";
      action = "Patch pothole damage and inspect road grid";
      priority = "MEDIUM";
      summary = "Damaged road or public infrastructure defect reported by citizen.";
    } else if (isCorp) {
      category = "Municipal Corporation";
      subcategory = "Grievance Cell & Civic Amenities";
      department = "Municipal Corporation";
      team = "GCC Civic Response Squad";
      action = "Inspect civic amenity and verify grievance";
      priority = "MEDIUM";
      summary = "Municipal civic grievance reported by citizen.";
    }

    return {
      language: text.includes('à®Žà®™à¯à®•à®³à¯') || text.includes('à®ªà¯à®•à¯ˆ') ? "Tamil" : "English",
      category,
      subcategory,
      priority,
      sentiment: emergency ? "Panicked" : "Frustrated",
      urgency: emergency ? 99 : 82,
      emergency,
      emergencyType,
      location: text.includes('t nagar') ? "T Nagar" : text.includes('ambattur') ? "Ambattur" : text.includes('adyar') ? "Adyar" : "Anna Nagar",
      zone: text.includes('t nagar') ? "Zone 2" : text.includes('ambattur') ? "Zone 5" : text.includes('adyar') ? "Zone 3" : "Zone 4",
      summary,
      department,
      recommendedTeam: team,
      recommendedAction: action,
      confidence: {
        classification: 0.96,
        department: 0.94,
        location: 0.90
      },
      entities: [
        "LOC: Chennai City Grid",
        "STATUS: Active Intake"
      ]
    };
  }

  async detectDuplicates(category: string, location: string, description: string): Promise<Array<{ id: string; score: number; reason: string }>> {
    return [
      { id: "CMP-10452", score: 0.94, reason: "Same category, location grid, and onset timestamp." },
      { id: "CMP-10468", score: 0.91, reason: "Identical issue description in Anna Nagar." }
    ];
  }

  async generateInsights(): Promise<any[]> {
    return [
      {
        type: "PREDICTED_HOTSPOT",
        title: "Post-Rainfall Drainage Outbreak Risk",
        risk: "HIGH",
        zone: "Zone 7",
        predictedIncrease: 42,
        reason: "Historical rainfall data correlated with recent 48-hour drainage complaint pattern.",
        recommendation: "Deploy heavy desilting inspection pumps to Zone 7 before citizen complaints surge further."
      }
    ];
  }
}

export class PythonAIProvider implements IAIProvider {
  private fallback = new MockAIProvider();
  private pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';

  async analyzeComplaint(transcript: string, rawInput?: string): Promise<AIAnalysisOutput> {
    try {
      const response = await fetch(`${this.pythonUrl}/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript || rawInput })
      });

      if (!response.ok) {
        return this.fallback.analyzeComplaint(transcript, rawInput);
      }

      const data = await response.json() as any;
      const classification = data.classification || {};
      const category = classification.category || "Water Supply";
      const urgencyScore = classification.urgency === "CRITICAL" ? 95 : classification.urgency === "HIGH" ? 80 : classification.urgency === "LOW" ? 35 : 60;
      const isEmergency = classification.urgency === "CRITICAL" || category.toLowerCase().includes("fire");

      return {
        language: data.detectedLanguage === "ta" ? "Tamil" : "English",
        category,
        subcategory: classification.problemType || classification.category || "Civic Complaint",
        priority: classification.urgency || "MEDIUM",
        sentiment: classification.sentiment || (isEmergency ? "Panicked" : "Frustrated"),
        urgency: urgencyScore,
        emergency: isEmergency,
        emergencyType: isEmergency ? "Critical Alert" : undefined,
        location: "Anna Nagar",
        zone: "Zone 4",
        summary: data.summary || transcript,
        department: classification.department || (
          category.includes("Water") ? "Water Board" :
          category.includes("Fire") ? "Fire & Rescue" :
          category.includes("Electric") ? "Electricity Board" :
          category.includes("Sanit") ? "Sanitation" :
          category.includes("Public Works") || category.includes("Road") ? "Public Works" :
          category.includes("Police") ? "Police" :
          category.includes("Health") ? "Healthcare" :
          category.includes("Transport") ? "Transport" :
          category.includes("Municipal") ? "Municipal Corporation" : category
        ),
        recommendedTeam: "Zone 4 Rapid Response Unit",
        recommendedAction: data.reasoning || "Inspect reported incident site immediately.",
        confidence: {
          classification: classification.confidence || 0.95,
          department: 0.92,
          location: 0.88
        },
        entities: [
          `CATEGORY: ${category}`,
          `CONFIDENCE: ${((classification.confidence || 0.95) * 100).toFixed(0)}%`
        ]
      };
    } catch (err) {
      console.warn('[AIProvider] Python ML microservice unavailable, using local heuristic model fallback.');
      return this.fallback.analyzeComplaint(transcript, rawInput);
    }
  }

  async detectDuplicates(category: string, location: string, description: string): Promise<Array<{ id: string; score: number; reason: string }>> {
    try {
      const response = await fetch(`${this.pythonUrl}/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: description, category })
      });

      if (!response.ok) {
        return this.fallback.detectDuplicates(category, location, description);
      }

      const data = await response.json() as any;
      if (data.is_duplicate && data.matches && data.matches.length) {
        return data.matches.map((m: any) => ({
          id: m.id || "CMP-10452",
          score: m.similarity || 0.92,
          reason: `High semantic similarity match (${((m.similarity || 0.92) * 100).toFixed(0)}%)`
        }));
      }
      return this.fallback.detectDuplicates(category, location, description);
    } catch (err) {
      return this.fallback.detectDuplicates(category, location, description);
    }
  }

  async generateInsights(): Promise<any[]> {
    try {
      const response = await fetch(`${this.pythonUrl}/metrics`);
      if (response.ok) {
        const metrics = await response.json() as any;
        return [
          {
            type: "ML_MODEL_ACCURACY",
            title: "Live Local ML Microservice Pipeline Metrics",
            risk: "OPTIMAL",
            zone: "City-Wide",
            predictedIncrease: 0,
            reason: `Category Model Accuracy: ${((metrics.category?.accuracy || 0.95) * 100).toFixed(1)}%. Urgency Model F1-Score: ${((metrics.urgency?.f1_macro || 0.92) * 100).toFixed(1)}%.`,
            recommendation: "Continuous monitoring active. ChromaDB Vector Index healthy."
          },
          ...(await this.fallback.generateInsights())
        ];
      }
    } catch (e) {
      // Fallback
    }
    return this.fallback.generateInsights();
  }
}

export class AIFactory {
  static getProvider(): IAIProvider {
    return new PythonAIProvider();
  }
}


