import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import {
  ArrowLeft, Send, Headphones, Info,
  Sparkles, Play, Trophy, RotateCcw, CheckCircle2, XCircle, Clock, Map, Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import StudentLayout from './StudentLayout';
// ── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'mcq' | 'form' | 'image_label' | 'image_map' | 'image_match';

interface Option {
  id: string;
  text: string;
}

/**
 * image_label  → an SVG/image with numbered hotspots; user types/selects a label per hotspot
 * image_map    → a floor-plan / map image with lettered zones; user picks which zone matches a description
 * image_match  → a set of diagrams/icons shown side by side; user matches a statement to one
 */
interface ImageHotspot {
  id: string;          // e.g. "A", "B", "1", "2"
  x: number;          // % from left
  y: number;          // % from top
  label?: string;     // display label on the hotspot marker
}

interface ImageQuestion {
  /** Public URL or inline SVG data-uri for the image */
  src: string;
  alt: string;
  hotspots?: ImageHotspot[];
  /** Word bank shown below image for image_label tasks */
  wordBank?: string[];
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: Option[];        // for MCQ / image_map / image_match
  answer: string;            // correct answer
  hint?: string;
  image?: ImageQuestion;     // for image_* types
  /** For image_label: which hotspot id this question is asking about */
  hotspotId?: string;
}

interface ListeningTask {
  id: string;
  title: string;
  description: string;
  type: string;
  topic: string;
  script: string;
  questions: Question[];
  /** If true, show a shared image above the question group */
  sharedImage?: ImageQuestion;
}

interface SectionResult {
  taskId: string;
  results: Array<Question & { userAnswer: string; correct: boolean }>;
}

// ── SVG Diagrams (inline, no external dependency) ────────────────────────────

/**
 * Simple SVG floor-plan for the Library Orientation task.
 * Zones are coloured rectangles labelled A-F.
 */
const LIBRARY_FLOOR_PLAN_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 360" font-family="system-ui,sans-serif">
  <!-- Background -->
  <rect width="500" height="360" fill="#f8fafc" rx="8"/>
  <!-- Outer walls -->
  <rect x="20" y="20" width="460" height="320" fill="none" stroke="#334155" stroke-width="3" rx="6"/>

  <!-- Ground Floor left: Periodicals (A) -->
  <rect x="20" y="20" width="130" height="160" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="85" y="95" text-anchor="middle" font-size="13" fill="#1e40af" font-weight="600">Periodicals</text>
  <text x="85" y="112" text-anchor="middle" font-size="22" fill="#1d4ed8" font-weight="800">A</text>

  <!-- Ground Floor centre: Info Desk (B) -->
  <rect x="150" y="20" width="200" height="80" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
  <text x="250" y="55" text-anchor="middle" font-size="13" fill="#166534" font-weight="600">Information Desk</text>
  <text x="250" y="78" text-anchor="middle" font-size="22" fill="#15803d" font-weight="800">B</text>

  <!-- Ground Floor right: Children (C) -->
  <rect x="350" y="20" width="130" height="160" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5"/>
  <text x="415" y="88" text-anchor="middle" font-size="13" fill="#854d0e" font-weight="600">Children's</text>
  <text x="415" y="106" text-anchor="middle" font-size="13" fill="#854d0e" font-weight="600">Library</text>
  <text x="415" y="130" text-anchor="middle" font-size="22" fill="#a16207" font-weight="800">C</text>

  <!-- Ground Floor centre-bottom: Entrance (shared) -->
  <rect x="150" y="100" width="200" height="80" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="250" y="142" text-anchor="middle" font-size="12" fill="#475569">Main Entrance Area</text>

  <!-- First Floor left: Reference (D) -->
  <rect x="20" y="180" width="200" height="80" fill="#fce7f3" stroke="#db2777" stroke-width="1.5"/>
  <text x="120" y="217" text-anchor="middle" font-size="13" fill="#9d174d" font-weight="600">Reference Section</text>
  <text x="120" y="240" text-anchor="middle" font-size="22" fill="#be185d" font-weight="800">D</text>

  <!-- First Floor right: Lending (E) -->
  <rect x="220" y="180" width="260" height="80" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>
  <text x="350" y="217" text-anchor="middle" font-size="13" fill="#4c1d95" font-weight="600">Main Lending Collection</text>
  <text x="350" y="240" text-anchor="middle" font-size="22" fill="#6d28d9" font-weight="800">E</text>

  <!-- Second Floor: Study Centre (F) -->
  <rect x="20" y="260" width="460" height="80" fill="#ffedd5" stroke="#ea580c" stroke-width="1.5"/>
  <text x="250" y="297" text-anchor="middle" font-size="13" fill="#9a3412" font-weight="600">Study Centre &amp; Meeting Rooms</text>
  <text x="250" y="322" text-anchor="middle" font-size="22" fill="#c2410c" font-weight="800">F</text>

  <!-- Floor labels -->
  <text x="490" y="120" text-anchor="end" font-size="10" fill="#64748b" transform="rotate(-90,490,120)">Ground Floor</text>
  <text x="490" y="225" text-anchor="end" font-size="10" fill="#64748b" transform="rotate(-90,490,225)">1st Floor</text>
  <text x="490" y="305" text-anchor="end" font-size="10" fill="#64748b" transform="rotate(-90,490,305)">2nd Floor</text>
</svg>
`)}`;

/**
 * Simple wildlife park map SVG — zones N/S/E/W + Central Arena.
 */
const WILDLIFE_PARK_MAP_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 380" font-family="system-ui,sans-serif">
  <rect width="500" height="380" fill="#f0fdf4" rx="8"/>
  <rect x="15" y="15" width="470" height="350" fill="none" stroke="#166534" stroke-width="2.5" rx="8"/>

  <!-- North: Aquatic Zone (A) -->
  <rect x="150" y="15" width="200" height="100" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5"/>
  <text x="250" y="60" text-anchor="middle" font-size="13" fill="#1e3a8a" font-weight="600">Aquatic Zone</text>
  <text x="250" y="82" text-anchor="middle" font-size="11" fill="#1e40af">(Penguin Feeding)</text>
  <text x="250" y="105" text-anchor="middle" font-size="20" fill="#1d4ed8" font-weight="800">A</text>

  <!-- West: Primate Enclosure (B) -->
  <rect x="15" y="115" width="130" height="140" fill="#d1fae5" stroke="#059669" stroke-width="1.5"/>
  <text x="80" y="178" text-anchor="middle" font-size="12" fill="#065f46" font-weight="600">Primate</text>
  <text x="80" y="194" text-anchor="middle" font-size="12" fill="#065f46" font-weight="600">Enclosure</text>
  <text x="80" y="218" text-anchor="middle" font-size="20" fill="#047857" font-weight="800">B</text>

  <!-- Central Arena (C) -->
  <ellipse cx="250" cy="195" rx="80" ry="70" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
  <text x="250" y="188" text-anchor="middle" font-size="12" fill="#92400e" font-weight="600">Central</text>
  <text x="250" y="204" text-anchor="middle" font-size="12" fill="#92400e" font-weight="600">Arena</text>
  <text x="250" y="224" text-anchor="middle" font-size="20" fill="#b45309" font-weight="800">C</text>

  <!-- East: Gift Shop + Cafeteria (D) -->
  <rect x="355" y="115" width="130" height="140" fill="#fce7f3" stroke="#db2777" stroke-width="1.5"/>
  <text x="420" y="175" text-anchor="middle" font-size="12" fill="#9d174d" font-weight="600">Gift Shop &amp;</text>
  <text x="420" y="191" text-anchor="middle" font-size="12" fill="#9d174d" font-weight="600">Cafeteria</text>
  <text x="420" y="215" text-anchor="middle" font-size="20" fill="#be185d" font-weight="800">D</text>

  <!-- South: Petting Zoo (E) -->
  <rect x="150" y="265" width="200" height="100" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>
  <text x="250" y="308" text-anchor="middle" font-size="13" fill="#4c1d95" font-weight="600">Petting Zoo &amp;</text>
  <text x="250" y="324" text-anchor="middle" font-size="12" fill="#4c1d95">Animal Interaction</text>
  <text x="250" y="350" text-anchor="middle" font-size="20" fill="#6d28d9" font-weight="800">E</text>

  <!-- Compass -->
  <text x="468" y="35" text-anchor="middle" font-size="14" fill="#166534" font-weight="700">N</text>
  <line x1="468" y1="40" x2="468" y2="55" stroke="#166534" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Main entrance label -->
  <text x="250" y="375" text-anchor="middle" font-size="10" fill="#6b7280">▼ Main Entrance</text>
</svg>
`)}`;

/**
 * Bioluminescence diagram: anglerfish with labelled parts.
 */
const ANGLERFISH_DIAGRAM_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320" font-family="system-ui,sans-serif">
  <rect width="520" height="320" fill="#0c1445" rx="8"/>

  <!-- Body -->
  <ellipse cx="240" cy="180" rx="120" ry="80" fill="#1a3a6e" stroke="#3b82f6" stroke-width="2"/>

  <!-- Tail -->
  <polygon points="360,150 440,120 440,240 360,210" fill="#1a3a6e" stroke="#3b82f6" stroke-width="2"/>

  <!-- Mouth -->
  <path d="M130 200 Q100 230 130 250" fill="none" stroke="#60a5fa" stroke-width="2.5"/>
  <!-- Teeth -->
  <line x1="115" y1="212" x2="122" y2="225" stroke="#93c5fd" stroke-width="1.5"/>
  <line x1="110" y1="222" x2="118" y2="234" stroke="#93c5fd" stroke-width="1.5"/>
  <line x1="113" y1="233" x2="121" y2="244" stroke="#93c5fd" stroke-width="1.5"/>

  <!-- Eye -->
  <circle cx="160" cy="155" r="18" fill="#0ea5e9" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="160" cy="155" r="8" fill="#0369a1"/>
  <circle cx="165" cy="150" r="3" fill="white" opacity="0.8"/>

  <!-- Dorsal fin lure (modified fin) -->
  <line x1="220" y1="100" x2="200" y2="55" stroke="#a78bfa" stroke-width="3"/>
  <ellipse cx="193" cy="42" rx="16" ry="12" fill="#fbbf24" stroke="#f59e0b" stroke-width="2" opacity="0.9"/>
  <!-- Glow effect -->
  <ellipse cx="193" cy="42" rx="24" ry="18" fill="none" stroke="#fde68a" stroke-width="1" opacity="0.5"/>
  <ellipse cx="193" cy="42" rx="32" ry="24" fill="none" stroke="#fde68a" stroke-width="0.5" opacity="0.25"/>

  <!-- Pectoral fin -->
  <ellipse cx="175" cy="235" rx="35" ry="15" fill="#1e4080" stroke="#3b82f6" stroke-width="1.5" transform="rotate(-30 175 235)"/>

  <!-- Hotspot labels -->
  <!-- 1: Lure (esca) -->
  <circle cx="193" cy="42" r="10" fill="#7c3aed" stroke="white" stroke-width="1.5" opacity="0.9"/>
  <text x="193" y="46" text-anchor="middle" font-size="11" fill="white" font-weight="700">1</text>

  <!-- 2: Eye -->
  <circle cx="160" cy="155" r="10" fill="#7c3aed" stroke="white" stroke-width="1.5" opacity="0.9"/>
  <text x="160" y="159" text-anchor="middle" font-size="11" fill="white" font-weight="700">2</text>

  <!-- 3: Modified dorsal fin (spine) -->
  <circle cx="220" cy="100" r="10" fill="#7c3aed" stroke="white" stroke-width="1.5" opacity="0.9"/>
  <text x="220" y="104" text-anchor="middle" font-size="11" fill="white" font-weight="700">3</text>

  <!-- 4: Tail -->
  <circle cx="400" cy="185" r="10" fill="#7c3aed" stroke="white" stroke-width="1.5" opacity="0.9"/>
  <text x="400" y="189" text-anchor="middle" font-size="11" fill="white" font-weight="700">4</text>

  <!-- 5: Pectoral fin -->
  <circle cx="175" cy="235" r="10" fill="#7c3aed" stroke="white" stroke-width="1.5" opacity="0.9"/>
  <text x="175" y="239" text-anchor="middle" font-size="11" fill="white" font-weight="700">5</text>

  <text x="260" y="305" text-anchor="middle" font-size="11" fill="#93c5fd">Fig 1 — Anatomy of a Deep-Sea Anglerfish</text>
</svg>
`)}`;

/**
 * Mercator vs Peters projection illustration.
 */
const MAP_PROJECTIONS_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 280" font-family="system-ui,sans-serif">
  <rect width="520" height="280" fill="#f8fafc" rx="8"/>

  <!-- Mercator -->
  <rect x="20" y="40" width="220" height="180" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5" rx="4"/>
  <!-- Grid lines -->
  <line x1="20" y1="85" x2="240" y2="85" stroke="#93c5fd" stroke-width="0.8"/>
  <line x1="20" y1="130" x2="240" y2="130" stroke="#93c5fd" stroke-width="0.8"/>
  <line x1="20" y1="175" x2="240" y2="175" stroke="#93c5fd" stroke-width="0.8"/>
  <line x1="93" y1="40" x2="93" y2="220" stroke="#93c5fd" stroke-width="0.8"/>
  <line x1="167" y1="40" x2="167" y2="220" stroke="#93c5fd" stroke-width="0.8"/>

  <!-- Greenland (exaggerated large near top) -->
  <ellipse cx="80" cy="62" rx="38" ry="20" fill="#16a34a" opacity="0.7"/>
  <text x="80" y="66" text-anchor="middle" font-size="9" fill="white" font-weight="600">Greenland</text>

  <!-- Africa (appears smaller) -->
  <ellipse cx="160" cy="140" rx="30" ry="40" fill="#ca8a04" opacity="0.7"/>
  <text x="160" y="143" text-anchor="middle" font-size="9" fill="white" font-weight="600">Africa</text>

  <!-- Europe -->
  <ellipse cx="110" cy="80" rx="22" ry="15" fill="#7c3aed" opacity="0.7"/>
  <text x="110" y="84" text-anchor="middle" font-size="8" fill="white">Europe</text>

  <!-- Distortion annotation -->
  <line x1="58" y1="50" x2="58" y2="82" stroke="#ef4444" stroke-width="1.5" marker-end="url(#a)"/>
  <text x="25" y="44" font-size="9" fill="#ef4444">Distorted</text>
  <text x="25" y="54" font-size="9" fill="#ef4444">↑ larger</text>

  <!-- Hotspot 1 -->
  <circle cx="80" cy="62" r="10" fill="#7c3aed" stroke="white" stroke-width="1.5"/>
  <text x="80" y="66" text-anchor="middle" font-size="11" fill="white" font-weight="700">1</text>

  <!-- Hotspot 2 -->
  <circle cx="160" cy="140" r="10" fill="#7c3aed" stroke="white" stroke-width="1.5"/>
  <text x="160" y="144" text-anchor="middle" font-size="11" fill="white" font-weight="700">2</text>

  <text x="130" y="235" text-anchor="middle" font-size="12" fill="#1e40af" font-weight="700">Mercator Projection</text>
  <text x="130" y="250" text-anchor="middle" font-size="10" fill="#6b7280">Standard nautical navigation</text>

  <!-- Peters -->
  <rect x="280" y="40" width="220" height="180" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5" rx="4"/>
  <!-- Grid lines -->
  <line x1="280" y1="85" x2="500" y2="85" stroke="#86efac" stroke-width="0.8"/>
  <line x1="280" y1="130" x2="500" y2="130" stroke="#86efac" stroke-width="0.8"/>
  <line x1="280" y1="175" x2="500" y2="175" stroke="#86efac" stroke-width="0.8"/>
  <line x1="353" y1="40" x2="353" y2="220" stroke="#86efac" stroke-width="0.8"/>
  <line x1="427" y1="40" x2="427" y2="220" stroke="#86efac" stroke-width="0.8"/>

  <!-- Greenland (accurate, small) -->
  <ellipse cx="335" cy="65" rx="15" ry="8" fill="#16a34a" opacity="0.7"/>
  <text x="335" y="69" text-anchor="middle" font-size="8" fill="white">Greenland</text>

  <!-- Africa (accurate, large) -->
  <ellipse cx="420" cy="135" rx="40" ry="60" fill="#ca8a04" opacity="0.7"/>
  <text x="420" y="137" text-anchor="middle" font-size="9" fill="white" font-weight="600">Africa</text>

  <!-- Europe -->
  <ellipse cx="370" cy="82" rx="18" ry="10" fill="#7c3aed" opacity="0.7"/>
  <text x="370" y="86" text-anchor="middle" font-size="8" fill="white">Europe</text>

  <!-- Hotspot 3 -->
  <circle cx="335" cy="65" r="10" fill="#7c3aed" stroke="white" stroke-width="1.5"/>
  <text x="335" y="69" text-anchor="middle" font-size="11" fill="white" font-weight="700">3</text>

  <!-- Hotspot 4 -->
  <circle cx="420" cy="135" r="10" fill="#7c3aed" stroke="white" stroke-width="1.5"/>
  <text x="420" y="139" text-anchor="middle" font-size="11" fill="white" font-weight="700">4</text>

  <text x="390" y="235" text-anchor="middle" font-size="12" fill="#166534" font-weight="700">Peters Projection</text>
  <text x="390" y="250" text-anchor="middle" font-size="10" fill="#6b7280">Equal-area, proposed 1974</text>
</svg>
`)}`;

// ── IELTS Data ────────────────────────────────────────────────────────────────

const IELTS_TASKS: ListeningTask[] = [
  // --- TEST 1 ---
  {
    id: '1',
    title: 'Section 1',
    topic: 'Booking a Holiday Apartment',
    type: 'Conversation between two people',
    description: 'Listen to a conversation between a caller and a holiday rental agent about booking an apartment.',
    script: `Agent: Good morning, Sunshine Rentals. How can I help you today?

Caller: Oh, hello. I'm calling because I'd like to book a holiday apartment for next month, if possible.

Agent: Of course! We have several properties available. Could I take your name first, please?

Caller: Yes, it's Patricia Morrison. That's M-O-R-R-I-S-O-N.

Agent: Thank you, Ms Morrison. And how many people will be staying?

Caller: There'll be four of us — two adults and two children. The children are aged seven and ten.

Agent: Perfect. And when would you like to arrive?

Caller: We're hoping to arrive on the fifteenth of August and stay for two weeks.

Agent: Let me check availability... Yes, we have a lovely two-bedroom apartment near the beach. The weekly rate is three hundred and fifty pounds, so that would be seven hundred pounds in total for two weeks.

Caller: That sounds reasonable. Does it include parking?

Agent: Yes, there is one parking space included. The apartment is on the third floor, and there is a lift available.

Caller: Wonderful. Is there a washing machine?

Agent: Yes, all our apartments come fully equipped with a washing machine and dryer. There's also free Wi-Fi throughout.

Caller: That's great. Could you tell me about the deposit?

Agent: We require a deposit of one hundred pounds to confirm the booking. This is fully refundable if you cancel more than thirty days before arrival.

Caller: And what's the address of the apartment?

Agent: It's Flat 3B, Ocean View Terrace, Newquay. The postcode is TR7 2HJ.

Caller: Could you spell that last part, please?

Agent: Yes, it's T for Tango, R for Romeo, seven, two, H for Hotel, J for Juliet.

Caller: Got it. And one more thing — is there a supermarket nearby?

Agent: There's a large supermarket about five minutes' walk away. There are also several restaurants and a pharmacy on the same street.

Caller: Brilliant. I'll go ahead and book it then.`,
    questions: [
      {
        id: 'q1_1', type: 'form',
        text: "1. What is the caller's surname?",
        answer: 'Morrison',
        hint: 'Listen for the name spelled out loud',
      },
      {
        id: 'q1_2', type: 'mcq',
        text: '2. How many people will be staying in the apartment?',
        options: [
          { id: 'A', text: 'A. Two adults only' },
          { id: 'B', text: 'B. Four people in total' },
          { id: 'C', text: 'C. Two adults and three children' },
          { id: 'D', text: 'D. Three people in total' },
        ],
        answer: 'B',
      },
      {
        id: 'q1_3', type: 'form',
        text: '3. What is the arrival date?',
        answer: '15th August',
        hint: 'A specific date is mentioned',
      },
      {
        id: 'q1_4', type: 'mcq',
        text: '4. What is the total cost for two weeks?',
        options: [
          { id: 'A', text: 'A. £350' },
          { id: 'B', text: 'B. £600' },
          { id: 'C', text: 'C. £700' },
          { id: 'D', text: 'D. £800' },
        ],
        answer: 'C',
      },
      {
        id: 'q1_5', type: 'form',
        text: '5. What is the apartment postcode?',
        answer: 'TR7 2HJ',
        hint: 'The agent spells it out letter by letter',
      },
      {
        id: 'q1_6', type: 'mcq',
        text: '6. What is within five minutes\' walk of the apartment?',
        options: [
          { id: 'A', text: 'A. A beach' },
          { id: 'B', text: 'B. A supermarket' },
          { id: 'C', text: 'C. A hospital' },
          { id: 'D', text: 'D. A bus station' },
        ],
        answer: 'B',
      },
    ],
  },
  {
    id: '2',
    title: 'Section 2',
    topic: 'City Library Orientation',
    type: 'Monologue in a social context',
    description: 'Listen to a guide giving an orientation talk at the Westfield City Library. Label the floor plan and answer questions about facilities.',
    script: `Welcome, everyone, to the Westfield City Library. My name is James Hartley, and I'll be your guide for today's orientation. Whether you're a new member or returning after a while, I hope this tour will help you make the most of everything we offer.

Let me begin with the layout. As you enter through the main doors, you'll find the information desk directly ahead of you. Staff there can help you with membership registration, renewals, and general enquiries. To the left of the information desk is our periodicals section, where you can read newspapers and magazines from both the UK and abroad.

Moving to the right side of the ground floor, you'll find the children's library. It's a bright, colourful space with reading corners and a storytelling area. We run weekly reading sessions for children aged three to eight every Saturday morning at ten o'clock.

Now, if you take the stairs or the lift to the first floor, you'll find our main lending collection. This is where most of our fiction and non-fiction books are shelved. We have over eighty thousand titles available for borrowing. Standard members can borrow up to six items at a time for a period of three weeks.

The reference section is also on the first floor, but please note that reference materials cannot be taken home. These include encyclopaedias, atlases, and legal documents.

On the second floor, we have our study centre. It has forty individual study desks, and ten of those are equipped with computers. You can book a computer in advance by calling reception or using our online portal. Sessions are limited to two hours per day.

We also have two meeting rooms available for hire on the second floor. These can accommodate up to twenty people and are popular with local community groups. Booking must be made at least forty-eight hours in advance.

Finally, I'd like to mention our digital services. All members have free access to our online catalogue, e-book library, and audiobook collection. Simply log in with your membership number on our website. If you have any trouble accessing these services, the IT helpdesk on the first floor will be happy to assist.

Thank you for listening. Please feel free to pick up a copy of our library guide from the information desk, and don't hesitate to ask any of our staff if you need help.`,
    sharedImage: {
      src: LIBRARY_FLOOR_PLAN_SVG,
      alt: 'Westfield City Library floor plan with zones labelled A to F',
      hotspots: [
        { id: 'A', x: 17, y: 27, label: 'A' },
        { id: 'B', x: 50, y: 14, label: 'B' },
        { id: 'C', x: 83, y: 27, label: 'C' },
        { id: 'D', x: 24, y: 56, label: 'D' },
        { id: 'E', x: 70, y: 56, label: 'E' },
        { id: 'F', x: 50, y: 83, label: 'F' },
      ],
    },
    questions: [
      {
        id: 'q2_img1', type: 'image_map',
        text: '1. Which zone (A–F) on the floor plan shows the Periodicals section?',
        image: { src: LIBRARY_FLOOR_PLAN_SVG, alt: 'Library floor plan' },
        options: [
          { id: 'A', text: 'Zone A' },
          { id: 'B', text: 'Zone B' },
          { id: 'C', text: 'Zone C' },
          { id: 'D', text: 'Zone D' },
          { id: 'E', text: 'Zone E' },
          { id: 'F', text: 'Zone F' },
        ],
        answer: 'A',
        hint: 'Listen for where the speaker says the periodicals section is relative to the information desk.',
      },
      {
        id: 'q2_img2', type: 'image_map',
        text: '2. The Children\'s Library is shown as which zone on the map?',
        image: { src: LIBRARY_FLOOR_PLAN_SVG, alt: 'Library floor plan' },
        options: [
          { id: 'A', text: 'Zone A' },
          { id: 'B', text: 'Zone B' },
          { id: 'C', text: 'Zone C' },
          { id: 'D', text: 'Zone D' },
          { id: 'E', text: 'Zone E' },
          { id: 'F', text: 'Zone F' },
        ],
        answer: 'C',
        hint: 'The guide says it is on the right side of the ground floor.',
      },
      {
        id: 'q2_1', type: 'mcq',
        text: '3. Where is the information desk located?',
        options: [
          { id: 'A', text: 'A. To the left of the entrance' },
          { id: 'B', text: 'B. Directly ahead of the main doors' },
          { id: 'C', text: 'C. On the first floor' },
          { id: 'D', text: 'D. Next to the children\'s library' },
        ],
        answer: 'B',
      },
      {
        id: 'q2_2', type: 'form',
        text: '4. At what time are the Saturday children\'s reading sessions held?',
        answer: '10am',
        hint: 'A specific time is mentioned',
      },
      {
        id: 'q2_3', type: 'mcq',
        text: '5. What must members do to hire a meeting room?',
        options: [
          { id: 'A', text: 'A. Book 24 hours in advance' },
          { id: 'B', text: 'B. Pay a deposit' },
          { id: 'C', text: 'C. Book 48 hours in advance' },
          { id: 'D', text: 'D. Apply online only' },
        ],
        answer: 'C',
      },
      {
        id: 'q2_4', type: 'image_map',
        text: '6. The Study Centre and Meeting Rooms occupy which zone?',
        image: { src: LIBRARY_FLOOR_PLAN_SVG, alt: 'Library floor plan' },
        options: [
          { id: 'A', text: 'Zone A' },
          { id: 'B', text: 'Zone B' },
          { id: 'C', text: 'Zone C' },
          { id: 'D', text: 'Zone D' },
          { id: 'E', text: 'Zone E' },
          { id: 'F', text: 'Zone F' },
        ],
        answer: 'F',
        hint: 'These are on the second floor.',
      },
    ],
  },
  {
    id: '3',
    title: 'Section 3',
    topic: 'University Assignment Discussion',
    type: 'Conversation in an academic context',
    description: 'Listen to two students discussing their research project on urban green spaces with their tutor, Dr. Chen.',
    script: `Tutor: Come in, Sarah, Jack. Take a seat. So, you wanted to discuss your research project on urban green spaces?

Sarah: Yes, thanks for seeing us, Dr. Chen. We've been doing quite a lot of reading but we're finding it difficult to narrow down our focus.

Dr. Chen: That's very common at this stage. Tell me what you've looked at so far.

Jack: We started with the environmental benefits — you know, air quality, temperature regulation, biodiversity. There's a huge amount of literature on that.

Dr. Chen: There certainly is. And what about the social dimension?

Sarah: That's actually where we got more interested. We found some compelling research suggesting that access to green spaces significantly reduces stress and improves mental wellbeing in urban populations.

Dr. Chen: Good. So you're leaning towards the psychological and social effects rather than the purely environmental angle?

Jack: Partly, yes. But we also want to look at inequality — how green space is distributed unevenly across cities. Lower-income areas often have far less access.

Dr. Chen: That's an excellent observation, and it's increasingly prominent in urban planning research. Are you planning any primary research, or will this be purely literature-based?

Sarah: We'd like to do a small survey — maybe twenty or thirty participants from different parts of the city — to complement the secondary sources.

Dr. Chen: That sounds manageable. Just be careful about making broad generalisations from such a small sample. Make sure your discussion acknowledges the limitations.

Jack: Definitely. We were also thinking of using some GIS mapping data to show the spatial distribution visually.

Dr. Chen: That could be very effective. Have you used GIS software before?

Jack: I took an introductory module last year, so I have some basic skills. Sarah is stronger on the statistical analysis side.

Dr. Chen: Perfect combination. For your assignment structure, I'd suggest opening with a theoretical framework, then moving through the environmental, social, and equity dimensions before presenting your primary findings. End with a strong conclusion that connects back to your central argument.

Sarah: How long should each section be, roughly?

Dr. Chen: Given that it's a five-thousand-word assignment, I'd say roughly a thousand words on theory and methodology, two thousand on your literature review, fifteen hundred on your primary findings, and five hundred for the conclusion.

Jack: That's really helpful. One last question — are we expected to include policy recommendations?

Dr. Chen: It's not required, but it would definitely strengthen your argument if you can suggest how your findings might inform planning decisions. It shows you understand the real-world relevance of academic research.

Sarah: Great. Thank you, Dr. Chen. We feel much clearer about our direction now.`,
    questions: [
      {
        id: 'q3_1', type: 'mcq',
        text: '1. What aspect of green spaces interests Sarah and Jack most?',
        options: [
          { id: 'A', text: 'A. Environmental benefits' },
          { id: 'B', text: 'B. Social and psychological effects' },
          { id: 'C', text: 'C. Economic impact' },
          { id: 'D', text: 'D. Biodiversity' },
        ],
        answer: 'B',
      },
      {
        id: 'q3_2', type: 'form',
        text: '2. What social issue related to green spaces do they want to explore?',
        answer: 'Uneven distribution',
        hint: 'They describe a problem affecting lower-income areas',
      },
      {
        id: 'q3_3', type: 'mcq',
        text: '3. How many participants are they planning for their survey?',
        options: [
          { id: 'A', text: 'A. 10–15' },
          { id: 'B', text: 'B. 20–30' },
          { id: 'C', text: 'C. 50–100' },
          { id: 'D', text: 'D. Over 100' },
        ],
        answer: 'B',
      },
      {
        id: 'q3_4', type: 'mcq',
        text: '4. What visual method will they use in their assignment?',
        options: [
          { id: 'A', text: 'A. Bar graphs' },
          { id: 'B', text: 'B. Photographs' },
          { id: 'C', text: 'C. GIS mapping' },
          { id: 'D', text: 'D. Infographics' },
        ],
        answer: 'C',
      },
      {
        id: 'q3_5', type: 'form',
        text: '5. How many words should the literature review section be?',
        answer: '2000',
        hint: 'Dr. Chen gives specific word counts for each section',
      },
      {
        id: 'q3_6', type: 'mcq',
        text: '6. What does Dr. Chen say about policy recommendations?',
        options: [
          { id: 'A', text: 'A. They are compulsory' },
          { id: 'B', text: 'B. They are not required but would strengthen the work' },
          { id: 'C', text: 'C. They should be avoided' },
          { id: 'D', text: 'D. They count for extra marks' },
        ],
        answer: 'B',
      },
    ],
  },
  {
    id: '4',
    title: 'Section 4',
    topic: 'The History of Cartography',
    type: 'Academic lecture',
    description: 'Listen to an academic lecture on the history and evolution of mapmaking. Use the diagram to answer image-based questions.',
    script: `Good afternoon, everyone. Today I'd like to take you on a journey through the history of cartography — the science and art of mapmaking — and explore how maps have shaped human understanding of the world.

The earliest known maps date back to ancient Babylon, around 2300 BCE. These were clay tablets that depicted not just physical geography but also the known cosmos. Interestingly, Babylon was placed at the very centre of these early world maps, reflecting the human tendency to position oneself at the heart of the universe.

Ancient Greek scholars made remarkable advances in cartographic theory. Anaximander, in the sixth century BCE, is credited with producing one of the first attempts at a world map based on geometric principles. Later, Ptolemy, writing in the second century CE, introduced the concept of latitude and longitude, a grid system that continues to underpin modern mapping.

However, during the European Middle Ages, cartographic progress stagnated. Maps of this period, known as Mappa Mundi, were less concerned with geographic accuracy and more focused on conveying theological and moral worldviews. Jerusalem was typically placed at the centre, with Europe, Africa, and Asia arranged around it in symbolic rather than geographical configurations.

The Renaissance brought a dramatic revival of interest in accurate representation. The rediscovery of Ptolemy's works in the fifteenth century, combined with the explosion of maritime exploration, created an urgent demand for reliable navigational charts. Portuguese and Spanish explorers needed maps they could actually use at sea.

A pivotal figure of this era was Gerardus Mercator, a Flemish cartographer working in the sixteenth century. His projection — a method of representing the curved surface of the earth on a flat plane — became the standard for nautical navigation. However, Mercator's projection significantly distorts the size of land masses near the poles. Greenland, for example, appears comparable in size to Africa on a Mercator map, when in reality Africa is approximately fourteen times larger.

This distortion sparked considerable controversy in the twentieth century, particularly from political geographers who argued that the map disproportionately enlarged northern, wealthier nations. In 1974, German historian Arno Peters proposed an alternative projection that preserved the relative size of land areas. Though more accurate in terms of area, the Peters projection distorts the shapes of continents.

The twentieth century also witnessed the transformation of cartography through technology. Aerial photography, and later satellite imagery, revolutionised the accuracy and detail of maps. Today, we have access to real-time geographic data through systems like GPS and platforms like Google Earth.

Yet despite these advances, maps remain profoundly interpretive documents. Every map involves choices — what to include, what to omit, how to represent borders — and those choices always reflect particular perspectives and priorities. As the geographer John Harley argued, maps are never neutral. They are instruments of communication, and sometimes, of power.

Thank you. I'll now take a few questions before we move on to the seminar discussion.`,
    sharedImage: {
      src: MAP_PROJECTIONS_SVG,
      alt: 'Side-by-side comparison of Mercator and Peters map projections with hotspots labelled 1–4',
    },
    questions: [
      {
        id: 'q4_1', type: 'mcq',
        text: '1. What did the earliest Babylonian maps depict?',
        options: [
          { id: 'A', text: 'A. Only physical geography' },
          { id: 'B', text: 'B. Trade routes' },
          { id: 'C', text: 'C. Geography and the cosmos' },
          { id: 'D', text: 'D. City boundaries' },
        ],
        answer: 'C',
      },
      {
        id: 'q4_2', type: 'form',
        text: '2. Who introduced the concept of latitude and longitude?',
        answer: 'Ptolemy',
        hint: 'A Greek scholar is named',
      },
      {
        id: 'q4_img1', type: 'image_label',
        text: '3. Look at the diagram above. What does hotspot 1 (on the Mercator projection) represent — which land mass appears exaggerated in size?',
        image: {
          src: MAP_PROJECTIONS_SVG,
          alt: 'Mercator vs Peters projections diagram',
          wordBank: ['Greenland', 'Africa', 'Europe', 'Asia', 'North America'],
        },
        answer: 'Greenland',
        hint: 'The lecturer specifically names a land mass near the poles that appears similar in size to Africa.',
      },
      {
        id: 'q4_img2', type: 'image_label',
        text: '4. In the Peters projection (right side), hotspot 4 shows the land mass depicted at its true relative size. What is it?',
        image: {
          src: MAP_PROJECTIONS_SVG,
          alt: 'Mercator vs Peters projections diagram',
          wordBank: ['Greenland', 'Africa', 'Europe', 'Asia', 'North America'],
        },
        answer: 'Africa',
        hint: 'The lecturer says Africa is approximately fourteen times larger than Greenland.',
      },
      {
        id: 'q4_3', type: 'mcq',
        text: '5. What is the main criticism of the Mercator projection?',
        options: [
          { id: 'A', text: 'A. It cannot be used at sea' },
          { id: 'B', text: 'B. It distorts land size near the poles' },
          { id: 'C', text: 'C. It shows the wrong borders' },
          { id: 'D', text: 'D. It was never widely adopted' },
        ],
        answer: 'B',
      },
      {
        id: 'q4_4', type: 'mcq',
        text: '6. According to the lecturer, what do all maps have in common?',
        options: [
          { id: 'A', text: 'A. They are always accurate' },
          { id: 'B', text: 'B. They reflect particular perspectives and priorities' },
          { id: 'C', text: 'C. They are created by governments' },
          { id: 'D', text: 'D. They use the Mercator projection' },
        ],
        answer: 'B',
      },
    ],
  },
  // --- TEST 2 ---
  {
    id: '5',
    title: 'Section 1',
    topic: 'Joining a Leisure Centre',
    type: 'Conversation between two people',
    description: 'Listen to a conversation between a receptionist and a man looking to join a local leisure centre.',
    script: `Receptionist: Good afternoon, welcome to the Riverside Leisure Centre. How can I help you?

Man: Hi there. I recently moved to the area and I'm interested in signing up for a membership. 

Receptionist: Excellent. We have a few different packages available. First, could I get your name and contact details?

Man: Sure, my name is Thomas Garrett. 

Receptionist: Could you spell your surname for me, please?

Man: It's G-A-R-R-E-T-T. 

Receptionist: Thank you, Mr. Garrett. And what's the best phone number to reach you on?

Man: My mobile number is zero seven seven eight nine, five five four, three two one.

Receptionist: Perfect. Now, regarding memberships, we have an 'Off-Peak' option, which allows you to use the facilities between 9 AM and 4 PM on weekdays, and a 'Premium' option which gives you unlimited access at any time, including weekends.

Man: I work standard office hours, so the Off-Peak package wouldn't be much use to me. I'll have to go with the Premium option. How much is that?

Receptionist: The Premium membership is forty-five pounds per month. However, if you commit to a full year in advance, it brings the monthly cost down to just thirty-eight pounds.

Man: I'd rather just pay monthly for now, in case my circumstances change. Does the membership include fitness classes?

Receptionist: Yes, the Premium membership includes all group fitness classes. We have yoga, spinning, pilates, and a new high-intensity interval training class that is very popular. You just need to book your spot 24 hours in advance via our mobile app.

Man: That sounds great. Do you have a swimming pool as well?

Receptionist: We do. We have a 25-metre heated indoor pool. There's also a sauna and steam room located just off the main pool area. 

Man: Fantastic. I'll sign up for the monthly Premium membership, please.`,
    questions: [
      {
        id: 'q5_1', type: 'form',
        text: "1. What is the man's surname?",
        answer: 'Garrett',
        hint: 'Listen for the spelling of the last name.',
      },
      {
        id: 'q5_2', type: 'form',
        text: '2. What is his mobile phone number?',
        answer: '07789 554 321',
        hint: 'Listen closely to the digits he recites.',
      },
      {
        id: 'q5_3', type: 'mcq',
        text: '3. Which membership type does the man choose?',
        options: [
          { id: 'A', text: 'A. Off-Peak monthly' },
          { id: 'B', text: 'B. Premium monthly' },
          { id: 'C', text: 'C. Premium annual' },
          { id: 'D', text: 'D. Off-Peak annual' },
        ],
        answer: 'B',
      },
      {
        id: 'q5_4', type: 'form',
        text: '4. How many hours in advance must you book a fitness class?',
        answer: '24',
        hint: 'Listen for the booking rules mentioned by the receptionist.',
      },
      {
        id: 'q5_5', type: 'mcq',
        text: '5. Which facility is located just off the main pool area?',
        options: [
          { id: 'A', text: 'A. A spinning studio' },
          { id: 'B', text: 'B. A yoga room' },
          { id: 'C', text: 'C. A sauna and steam room' },
          { id: 'D', text: 'D. The changing rooms' },
        ],
        answer: 'C',
      },
    ],
  },
  {
    id: '6',
    title: 'Section 2',
    topic: 'Wildlife Park Tour',
    type: 'Monologue in a social context',
    description: 'Listen to a tour guide giving visitors an overview of the day\'s schedule. Use the park map to answer location questions.',
    script: `Hello everyone, and welcome to the Oakwood Wildlife Park! We are absolutely thrilled to have you with us today. Before you head off to explore, I want to quickly run through some of the daily events and feeding times so you don't miss out on the highlights.

Right now it's 9:30 AM. The park is fully open, and I highly recommend heading over to the primate enclosure first. They are most active in the morning.

At 11:30 AM, we have our famous penguin feeding session. This takes place at the Aquatic Zone, which is located in the northern sector of the park. It's incredibly popular, so try to get there a few minutes early to secure a good viewing spot. The keepers will also be giving a short talk about marine conservation during the feed.

After lunch, at 2:00 PM, you won't want to miss the Birds of Prey flight demonstration. This happens in the central arena. You'll get to see eagles, falcons, and owls flying right over your heads. Please remember to remain seated during the demonstration for your own safety and the safety of the birds.

If you have young children with you, the petting zoo is open all day. It's situated right next to the main cafeteria. However, please be aware that the animal interaction zone closes at 4:00 PM to give our smaller animals a chance to rest before the park closes.

Finally, a quick safety reminder. Please do not attempt to feed any of the animals with your own food. Many of our animals are on strict, specialized diets, and human food can make them very ill. If you wish to feed the animals, specially formulated feed bags are available for purchase at the gift shop for just two pounds.

Have a wonderful day exploring the park, and if you need any assistance, any of our staff members wearing green polo shirts will be happy to help.`,
    sharedImage: {
      src: WILDLIFE_PARK_MAP_SVG,
      alt: 'Oakwood Wildlife Park map with zones labelled A to E',
    },
    questions: [
      {
        id: 'q6_img1', type: 'image_map',
        text: '1. Look at the park map. Which zone (A–E) is the Aquatic Zone, where the penguin feeding takes place?',
        image: { src: WILDLIFE_PARK_MAP_SVG, alt: 'Wildlife park map' },
        options: [
          { id: 'A', text: 'Zone A — North' },
          { id: 'B', text: 'Zone B — West' },
          { id: 'C', text: 'Zone C — Central' },
          { id: 'D', text: 'Zone D — East' },
          { id: 'E', text: 'Zone E — South' },
        ],
        answer: 'A',
        hint: 'The guide says the Aquatic Zone is in the northern sector.',
      },
      {
        id: 'q6_img2', type: 'image_map',
        text: '2. The Birds of Prey demonstration takes place in which zone on the map?',
        image: { src: WILDLIFE_PARK_MAP_SVG, alt: 'Wildlife park map' },
        options: [
          { id: 'A', text: 'Zone A — North' },
          { id: 'B', text: 'Zone B — West' },
          { id: 'C', text: 'Zone C — Central' },
          { id: 'D', text: 'Zone D — East' },
          { id: 'E', text: 'Zone E — South' },
        ],
        answer: 'C',
        hint: 'Listen for the location of the central arena.',
      },
      {
        id: 'q6_1', type: 'mcq',
        text: '3. Which animals does the guide recommend seeing first?',
        options: [
          { id: 'A', text: 'A. The penguins' },
          { id: 'B', text: 'B. The birds of prey' },
          { id: 'C', text: 'C. The primates' },
          { id: 'D', text: 'D. The petting zoo animals' },
        ],
        answer: 'C',
      },
      {
        id: 'q6_2', type: 'form',
        text: '4. At what time does the animal interaction zone close?',
        answer: '4:00 PM',
        hint: 'Listen for the closing time of the area next to the cafeteria.',
      },
      {
        id: 'q6_img3', type: 'image_map',
        text: '5. The Petting Zoo and Animal Interaction area is next to the cafeteria. Which zone does this match on the map?',
        image: { src: WILDLIFE_PARK_MAP_SVG, alt: 'Wildlife park map' },
        options: [
          { id: 'A', text: 'Zone A — North' },
          { id: 'B', text: 'Zone B — West' },
          { id: 'C', text: 'Zone C — Central' },
          { id: 'D', text: 'Zone D — East' },
          { id: 'E', text: 'Zone E — South' },
        ],
        answer: 'E',
        hint: 'The guide says the petting zoo is situated next to the cafeteria.',
      },
    ],
  },
  {
    id: '7',
    title: 'Section 3',
    topic: 'Student Presentation Planning',
    type: 'Conversation in an academic context',
    description: 'Listen to two university students, Chloe and Mark, discussing their upcoming marketing presentation with their tutor.',
    script: `Tutor: Hi Chloe, hi Mark. Come on in. Let's review your progress for the upcoming marketing presentation. Have you finalized your core topic?

Chloe: Yes, we have. We've decided to focus on the impact of influencer marketing on consumer purchasing behavior, specifically targeting the Gen Z demographic.

Tutor: That's a very timely topic. Have you divided up the research workload yet?

Mark: We have. I'm going to handle the historical context and the shift from traditional celebrity endorsements to micro-influencers. Chloe is going to focus on the psychological aspects—why younger consumers trust these influencers more than traditional advertising.

Tutor: That sounds like a solid division of labor. Are you planning to include any case studies?

Chloe: Yes, we want to look at two specific campaigns. I'm researching a successful campaign by a sustainable cosmetics brand, and Mark is analyzing a failed campaign by a fast-fashion retailer to show the contrast.

Tutor: Excellent. Analyzing a failure often yields deeper insights than just looking at successes. Now, regarding the presentation format, remember that you only have 15 minutes. How are you structuring the slides?

Mark: We were thinking of having about twenty slides in total. We want to keep them highly visual, using mostly charts and infographics rather than blocks of text.

Tutor: Twenty slides in fifteen minutes means less than a minute per slide. You might find yourselves rushing. I'd strongly advise cutting that down to a maximum of twelve to fourteen slides. You want to speak *to* the audience, not just click through a rapid slideshow.

Chloe: That makes sense. We'll condense the data. 

Tutor: Good. And have you noted the final submission date for the presentation slides and the accompanying report?

Mark: Yes, it's the 22nd of November, isn't it?

Tutor: Correct. The slides need to be uploaded to the portal by 5:00 PM on the 22nd. The actual presentations will take place the following week. 

Chloe: Great, we are on track to finish the draft by this Friday. We'll send it over for your feedback then.`,
    questions: [
      {
        id: 'q7_1', type: 'mcq',
        text: '1. Which demographic is the focus of Chloe and Mark\'s presentation?',
        options: [
          { id: 'A', text: 'A. Millennials' },
          { id: 'B', text: 'B. Gen Z' },
          { id: 'C', text: 'C. Baby Boomers' },
          { id: 'D', text: 'D. Gen X' },
        ],
        answer: 'B',
      },
      {
        id: 'q7_2', type: 'mcq',
        text: '2. What is Mark researching for the presentation?',
        options: [
          { id: 'A', text: 'A. The psychological aspects of trust' },
          { id: 'B', text: 'B. A successful sustainable cosmetics campaign' },
          { id: 'C', text: 'C. The shift from traditional celebrity endorsements' },
          { id: 'D', text: 'D. Future trends in marketing' },
        ],
        answer: 'C',
      },
      {
        id: 'q7_3', type: 'form',
        text: '3. What type of brand was involved in the successful campaign Chloe is researching?',
        answer: 'Sustainable cosmetics',
        hint: 'Listen for the specific industry mentioned by Chloe.',
      },
      {
        id: 'q7_4', type: 'mcq',
        text: '4. What does the tutor advise regarding the presentation slides?',
        options: [
          { id: 'A', text: 'A. Use more text blocks' },
          { id: 'B', text: 'B. Have about 20 slides' },
          { id: 'C', text: 'C. Reduce the number to 12-14 slides' },
          { id: 'D', text: 'D. Extend the presentation to 20 minutes' },
        ],
        answer: 'C',
      },
      {
        id: 'q7_5', type: 'form',
        text: '5. What is the submission date for the slides and report?',
        answer: '22nd November',
        hint: 'Listen for the specific date mentioned at the end.',
      },
    ],
  },
  {
    id: '8',
    title: 'Section 4',
    topic: 'The Science of Bioluminescence',
    type: 'Academic lecture',
    description: 'Listen to a biology lecture on bioluminescence in marine life. Label the anglerfish anatomy diagram.',
    script: `Welcome back to our marine biology module. Today, we are exploring one of the most mesmerizing phenomena in the natural world: bioluminescence. This is the biochemical emission of light by living organisms. While it can be found on land—think of fireflies or certain fungi—it is overwhelmingly a marine phenomenon. 

To understand bioluminescence, we must first look at the chemistry behind it. The light is produced by a chemical reaction involving a light-emitting molecule, generically called luciferin, and an enzyme called luciferase. When oxygen is introduced to this mixture, the luciferin oxidizes, and the energy from this reaction is released as visible light. Unlike the light from a traditional incandescent light bulb, which wastes a huge amount of energy as heat, bioluminescence is "cold light." Nearly 100% of the energy is emitted as light, making it incredibly efficient.

But why did this evolve? In the vast, dark expanse of the deep ocean, where sunlight cannot penetrate beyond about 200 meters, emitting light serves several critical evolutionary functions. 

The first function is defense. Some species of squid, when threatened by a predator, will eject a cloud of bioluminescent chemicals instead of ink. This sudden, glowing burst temporarily blinds and confuses the predator, allowing the squid to escape into the darkness. 

The second major function is predation. The most famous example of this is the anglerfish. It possesses a modified dorsal fin that acts like a fishing rod, dangling a glowing, bacteria-filled sac in front of its mouth. In the pitch-black environment, smaller fish are drawn to this light like moths to a flame, only to be swiftly consumed.

Finally, bioluminescence plays a vital role in communication and mating. Many deep-sea shrimp and jellyfish use specific patterns of light flashes to identify members of their own species and attract mates. Because the deep ocean is so vast and sparsely populated, this visual signaling is far more effective than chemical or acoustic communication over short distances.

Interestingly, medical science is now borrowing from the ocean. Researchers are utilizing the green fluorescent protein, originally discovered in jellyfish, as a biological marker. By attaching this glowing protein to specific genes or cells, scientists can literally watch cellular processes unfold in real-time under a microscope, which has revolutionized genetics and cancer research.`,
    sharedImage: {
      src: ANGLERFISH_DIAGRAM_SVG,
      alt: 'Labelled diagram of an anglerfish with numbered hotspots 1–5',
      hotspots: [
        { id: '1', x: 37, y: 13, label: '1' },
        { id: '2', x: 31, y: 48, label: '2' },
        { id: '3', x: 42, y: 31, label: '3' },
        { id: '4', x: 77, y: 58, label: '4' },
        { id: '5', x: 34, y: 73, label: '5' },
      ],
      wordBank: ['Lure (esca)', 'Eye', 'Modified dorsal fin spine', 'Tail fin', 'Pectoral fin', 'Mouth', 'Gill'],
    },
    questions: [
      {
        id: 'q8_1', type: 'form',
        text: '1. What is the name of the enzyme required to produce bioluminescence?',
        answer: 'luciferase',
        hint: 'Listen for the chemical components mentioned early in the lecture.',
      },
      {
        id: 'q8_2', type: 'mcq',
        text: '2. Why is bioluminescence referred to as "cold light"?',
        options: [
          { id: 'A', text: 'A. Because it only occurs in freezing waters' },
          { id: 'B', text: 'B. Because nearly 100% of the energy is emitted as light, not heat' },
          { id: 'C', text: 'C. Because the chemical reaction requires ice' },
          { id: 'D', text: 'D. Because it is blue in color' },
        ],
        answer: 'B',
      },
      {
        id: 'q8_img1', type: 'image_label',
        text: '3. Refer to the anglerfish diagram. Hotspot 1 marks the glowing structure used to attract prey. Choose the correct label from the word bank.',
        image: {
          src: ANGLERFISH_DIAGRAM_SVG,
          alt: 'Anglerfish anatomy diagram',
          wordBank: ['Lure (esca)', 'Eye', 'Modified dorsal fin spine', 'Tail fin', 'Pectoral fin'],
        },
        hotspotId: '1',
        answer: 'Lure (esca)',
        hint: 'The lecturer describes "a glowing, bacteria-filled sac" dangled in front of the mouth.',
      },
      {
        id: 'q8_img2', type: 'image_label',
        text: '4. Hotspot 3 marks the structure that acts like a fishing rod to hold the lure. Choose the correct label.',
        image: {
          src: ANGLERFISH_DIAGRAM_SVG,
          alt: 'Anglerfish anatomy diagram',
          wordBank: ['Lure (esca)', 'Eye', 'Modified dorsal fin spine', 'Tail fin', 'Pectoral fin'],
        },
        hotspotId: '3',
        answer: 'Modified dorsal fin spine',
        hint: 'The lecturer says the anglerfish has "a modified dorsal fin that acts like a fishing rod."',
      },
      {
        id: 'q8_3', type: 'mcq',
        text: '5. What have medical researchers used green fluorescent protein for?',
        options: [
          { id: 'A', text: 'A. To cure deep-sea viruses' },
          { id: 'B', text: 'B. As a biological marker to watch cellular processes' },
          { id: 'C', text: 'C. To create better underwater lighting' },
          { id: 'D', text: 'D. To develop new sunscreen formulas' },
        ],
        answer: 'B',
      },
    ],
  },
];

// ── Band Score Helper ─────────────────────────────────────────────────────────

function getIELTSBand(correct: number, total: number): string {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  if (pct >= 97) return '9.0';
  if (pct >= 89) return '8.5';
  if (pct >= 83) return '8.0';
  if (pct >= 75) return '7.5';
  if (pct >= 67) return '7.0';
  if (pct >= 58) return '6.5';
  if (pct >= 50) return '6.0';
  if (pct >= 42) return '5.5';
  if (pct >= 33) return '5.0';
  return '4.5';
}

function checkAnswer(question: Question, userAnswer: string): boolean {
  const ua = userAnswer.trim().toLowerCase();
  const ca = question.answer.trim().toLowerCase();
  if (question.type === 'mcq' || question.type === 'image_map') return ua === ca;
  if (question.type === 'image_label') {
    // accept if answer contains the key word(s)
    return ca.split(' ').filter(w => w.length > 3).some(word => ua.includes(word));
  }
  return ca.split(' ').some(word => word.length > 3 && ua.includes(word));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Question type badge label helper ─────────────────────────────────────────

function questionTypeBadge(type: QuestionType) {
  const map: Record<QuestionType, { label: string; color: string }> = {
    mcq:          { label: 'Multiple Choice',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    form:         { label: 'Short Answer',       color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    image_label:  { label: 'Diagram Labelling',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    image_map:    { label: 'Map / Plan',         color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    image_match:  { label: 'Image Matching',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  };
  const { label, color } = map[type];
  return <span className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${color} mb-2`}>{label}</span>;
}

// ── ImageQuestionBlock ────────────────────────────────────────────────────────

interface ImageQuestionBlockProps {
  question: Question;
  answer: string;
  onAnswer: (val: string) => void;
}

function ImageQuestionBlock({ question, answer, onAnswer }: ImageQuestionBlockProps) {
  const img = question.image;
  if (!img) return null;

  // image_map: show a compact image thumbnail + zone grid buttons
  if (question.type === 'image_map') {
    return (
      <div className="space-y-4">
        {/* Map thumbnail */}
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 max-h-56">
          <img
            src={img.src}
            alt={img.alt}
            className="w-full h-full object-contain max-h-56"
            draggable={false}
          />
        </div>
        {/* Zone grid */}
        <div className="grid grid-cols-3 gap-2">
          {(question.options ?? []).map(opt => {
            const selected = answer === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onAnswer(opt.id)}
                className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 text-left
                  ${selected
                    ? 'border-[#7B61FF] bg-indigo-50 text-indigo-800 dark:border-[#7B61FF] dark:bg-[#7B61FF]/10 dark:text-indigo-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#7B61FF]/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#7B61FF]/40'
                  }`}
              >
                <span className={`inline-block w-5 h-5 rounded-full border-2 mr-2 text-xs font-bold text-center leading-4
                  ${selected ? 'border-[#7B61FF] bg-[#7B61FF] text-white' : 'border-slate-400 dark:border-slate-500'}`}>
                  {opt.id}
                </span>
                {opt.text.replace(`Zone ${opt.id} — `, '')}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // image_label: show image + word bank chips
  if (question.type === 'image_label') {
    const wordBank = img.wordBank ?? [];
    return (
      <div className="space-y-4">
        {/* Diagram */}
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 max-h-56">
          <img
            src={img.src}
            alt={img.alt}
            className="w-full object-contain max-h-56"
            draggable={false}
          />
        </div>
        {/* Word bank */}
        {wordBank.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider font-semibold">
              Word Bank — click to select your answer:
            </p>
            <div className="flex flex-wrap gap-2">
              {wordBank.map(word => {
                const selected = answer === word;
                return (
                  <button
                    key={word}
                    onClick={() => onAnswer(selected ? '' : word)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all duration-150
                      ${selected
                        ? 'border-[#7B61FF] bg-indigo-50 text-indigo-800 dark:border-[#7B61FF] dark:bg-[#7B61FF]/15 dark:text-indigo-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#7B61FF]/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* Also allow free text in case user wants to type */}
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Or type your answer:</p>
          <input
            type="text"
            value={answer}
            onChange={e => onAnswer(e.target.value)}
            placeholder="Type label here…"
            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm
              placeholder-slate-400 dark:placeholder-slate-500 outline-none
              focus:border-[#7B61FF] dark:focus:border-[#7B61FF] transition-colors"
          />
        </div>
      </div>
    );
  }

  return null;
}

// ── Shared Image Panel ────────────────────────────────────────────────────────

function SharedImagePanel({ image, isPlaying }: { image: ImageQuestion; isPlaying: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900
      transition-all duration-300 ${expanded ? '' : 'max-h-64'}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Map className="w-3.5 h-3.5" />
          Reference Diagram / Map
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-[#7B61FF] dark:text-[#9b86ff] hover:underline"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[600px]' : 'max-h-52'}`}>
        <img
          src={image.src}
          alt={image.alt}
          className="w-full object-contain"
          draggable={false}
        />
      </div>
      {isPlaying && (
        <div className="px-3 py-1.5 bg-indigo-50 dark:bg-[#7B61FF]/10 border-t border-indigo-100 dark:border-[#7B61FF]/20">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse inline-block" />
            Study this diagram while listening
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type ScreenView = 'home' | 'test' | 'results';

export default function ListeningPractice() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [screen, setScreen] = useState<ScreenView>('home');
  const [selectedTask, setSelectedTask] = useState<ListeningTask | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [allResults, setAllResults] = useState<SectionResult[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [currentBoundaryIndex, setCurrentBoundaryIndex] = useState(-1);
  const [scriptVisible, setScriptVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { window.speechSynthesis.getVoices(); }, []);

  useEffect(() => {
    let fixInterval: ReturnType<typeof setInterval>;
    if (screen === 'test' && isPlaying) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      fixInterval = setInterval(() => {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 14000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fixInterval) clearInterval(fixInterval);
    };
  }, [screen, isPlaying]);

  useEffect(() => {
    if (screen !== 'test') {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      setCurrentBoundaryIndex(-1);
      setScriptVisible(false);
    }
  }, [screen]);

  const scriptParagraphs = useMemo(() => {
    if (!selectedTask) return [];
    const paragraphs: Array<Array<{ text: string; space: string; start: number; end: number }>> = [];
    let currentIndex = 0;
    const paras = selectedTask.script.split('\n\n');
    paras.forEach((para) => {
      const words: Array<{ text: string; space: string; start: number; end: number }> = [];
      const regex = /([^\s]+)(\s*)/g;
      let match;
      while ((match = regex.exec(para)) !== null) {
        words.push({
          text: match[1],
          space: match[2],
          start: currentIndex + match.index,
          end: currentIndex + match.index + match[1].length
        });
      }
      paragraphs.push(words);
      currentIndex += para.length + 2;
    });
    return paragraphs;
  }, [selectedTask]);

  const speak = useCallback(() => {
    if (!selectedTask) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(selectedTask.script);
    (window as any)._speechBugFix = utter;
    const availableVoices = window.speechSynthesis.getVoices();
    const localEnglishVoice = availableVoices.find(v => v.lang.startsWith('en') && v.localService);
    if (localEnglishVoice) {
      utter.voice = localEnglishVoice;
    } else {
      const backupVoice = availableVoices.find(v => v.localService) || availableVoices.find(v => v.lang.startsWith('en'));
      if (backupVoice) utter.voice = backupVoice;
    }
    utter.rate = 0.88;
    utter.pitch = 1;
    utter.onstart = () => { setIsPlaying(true); setHasPlayed(true); setCurrentBoundaryIndex(0); setScriptVisible(true); };
    utter.onend = () => { setIsPlaying(false); setCurrentBoundaryIndex(-1); setScriptVisible(false); };
    utter.onerror = () => { setIsPlaying(false); setCurrentBoundaryIndex(-1); setScriptVisible(false); };
    utter.onboundary = (event) => { setCurrentBoundaryIndex(event.charIndex); };
    window.speechSynthesis.speak(utter);
  }, [selectedTask]);

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentBoundaryIndex(-1);
    setScriptVisible(false);
  };

  const openTask = (task: ListeningTask) => {
    stopAudio();
    setSelectedTask(task);
    setAnswers({});
    setScriptVisible(false);
    setElapsed(0);
    setHasPlayed(false);
    setCurrentBoundaryIndex(-1);
    setScreen('test');
  };

  const handleBack = () => { stopAudio(); setScreen('home'); setSelectedTask(null); };

  const handleOptionSelect = (questionId: string, optionId: string) =>
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));

  const handleFormInput = (questionId: string, value: string) =>
    setAnswers(prev => ({ ...prev, [questionId]: value }));

  const handleSubmit = async () => {
    if (!selectedTask) return;
    const unanswered = selectedTask.questions.filter(q => !answers[q.id] || answers[q.id].trim() === '');
    if (unanswered.length > 0) {
      toast({
        title: 'Incomplete Test',
        description: `Please answer all ${selectedTask.questions.length} questions before submitting.`,
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const results = selectedTask.questions.map(q => ({
        ...q,
        userAnswer: answers[q.id] || '—',
        correct: checkAnswer(q, answers[q.id] || ''),
      }));
      setAllResults(prev => {
        const filtered = prev.filter(r => r.taskId !== selectedTask.id);
        return [...filtered, { taskId: selectedTask.id, results }];
      });
      const score = results.filter(r => r.correct).length;
      setSubmitting(false);
      toast({
        title: `${selectedTask.title} Complete!`,
        description: `You scored ${score} out of ${selectedTask.questions.length}.`,
      });
      setScreen('results');
    }, 1000);
  };

  // Highlight active word in transcript
  let activeWordStart = -1;
  if (isPlaying && currentBoundaryIndex >= 0) {
    let found = -1;
    for (const para of scriptParagraphs) {
      for (const wordObj of para) {
        if (wordObj.start <= currentBoundaryIndex) { found = wordObj.start; } else { break; }
      }
    }
    activeWordStart = found;
  }

  const totalCorrect = allResults.reduce((sum, r) => sum + r.results.filter(q => q.correct).length, 0);
  const totalQ = allResults.reduce((sum, r) => sum + r.results.length, 0);
  const band = getIELTSBand(totalCorrect, totalQ);
  const answeredCount = selectedTask
    ? selectedTask.questions.filter(q => answers[q.id] && answers[q.id].trim() !== '').length
    : 0;

  // Count image-based questions for a task
  const imageQCount = (task: ListeningTask) =>
    task.questions.filter(q => q.type === 'image_label' || q.type === 'image_map' || q.type === 'image_match').length;

  // ── HOME VIEW ──────────────────────────────────────────────────────────────

  const renderHome = () => (
    <div className="space-y-8">
      <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
            IELTS Listening Practice <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
          </h1>
          <p className="text-indigo-50 max-w-2xl text-base md:text-lg leading-relaxed">
            Improve your listening skills with authentic voice scripts. Sections now include
            <strong className="text-yellow-200"> diagram labelling and map / plan tasks</strong> — just like the real IELTS Academic exam.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {IELTS_TASKS.map((task) => {
          const done = allResults.find(r => r.taskId === task.id);
          const score = done ? done.results.filter(q => q.correct).length : null;
          const imgQs = imageQCount(task);
          return (
            <Card
              key={task.id}
              onClick={() => openTask(task)}
              className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900
                hover:shadow-md hover:border-[#7B61FF] dark:hover:border-[#7B61FF] transition-all cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#7B61FF] dark:text-[#9b86ff]">
                      {task.title}
                    </span>
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100
                      group-hover:text-[#7B61FF] dark:group-hover:text-[#9b86ff] transition-colors leading-tight">
                      {task.topic}
                    </CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {done ? (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {score}/{task.questions.length} ✓
                      </Badge>
                    ) : (
                      <Badge className="bg-indigo-50 text-[#7B61FF] hover:bg-indigo-100 dark:bg-[#7B61FF]/20 dark:text-[#9b86ff]">
                        New
                      </Badge>
                    )}
                    {imgQs > 0 && (
                      <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> {imgQs} Image Q{imgQs > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{task.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-4">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{task.type}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center
                  text-xs font-medium text-slate-500 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Headphones className="w-3 h-3" /> {task.questions.length} Questions
                  </span>
                  <span className="text-[#7B61FF] dark:text-[#9b86ff] flex items-center group-hover:translate-x-1 transition-transform">
                    {done ? 'Retry' : 'Start Listening'} <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allResults.length > 0 && (
        <Card
          className="border border-[#7B61FF]/30 bg-indigo-50/50 dark:bg-[#7B61FF]/10 dark:border-[#7B61FF]/30 cursor-pointer hover:bg-indigo-100/50 transition-all"
          onClick={() => setScreen('results')}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-[#7B61FF] dark:text-[#9b86ff]" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Overall Progress</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {totalCorrect}/{totalQ} correct · Estimated Band {band}
                </p>
              </div>
            </div>
            <span className="text-[#7B61FF] dark:text-[#9b86ff] font-medium text-sm">View Results →</span>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
        💡 <strong>Exam Tip:</strong> For diagram and map tasks, study the image carefully <em>before</em> pressing Play. In the real IELTS exam you hear each recording only once.
      </p>
    </div>
  );

  // ── TEST VIEW ──────────────────────────────────────────────────────────────

  const renderTest = () => {
    if (!selectedTask) return null;
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2 w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Modules
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-mono text-slate-500 dark:text-slate-400
              bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              {formatTime(elapsed)}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#7B61FF] hover:bg-[#6a50e5] text-white shadow-sm w-full sm:w-auto"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center"><Send className="w-4 h-4 mr-2" /> Submit Answers</span>
              )}
            </Button>
          </div>
        </div>

        {/* Split Content */}
        <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">

          {/* Left: Audio Player + Shared Diagram + Tips */}
          <div className="w-full lg:w-[40%] flex flex-col gap-5">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex-shrink-0">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-[#7B61FF] dark:text-[#9b86ff] mb-2">
                  <Headphones className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Audio Player</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl text-slate-800 dark:text-white leading-tight">
                      {selectedTask.title}: {selectedTask.topic}
                    </CardTitle>
                    <CardDescription className="dark:text-slate-400 mt-1 text-xs">
                      {selectedTask.type}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">{selectedTask.questions.length} Qs</Badge>
                    {imageQCount(selectedTask) > 0 && (
                      <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 text-xs flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5" /> Image Tasks
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* TTS Controls */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 flex-wrap">
                    {!isPlaying && !hasPlayed && (
                      <Button onClick={speak} className="bg-[#7B61FF] hover:bg-[#6a50e5] text-white gap-2 flex-1 sm:flex-none">
                        <Play className="w-4 h-4" /> Play Audio
                      </Button>
                    )}
                    {isPlaying && (
                      <Button disabled className="bg-[#7B61FF]/60 text-white gap-2 flex-1 sm:flex-none cursor-not-allowed">
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Playing Audio...
                      </Button>
                    )}
                    {!isPlaying && hasPlayed && (
                      <Button disabled className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 gap-2 flex-1 sm:flex-none cursor-not-allowed">
                        <CheckCircle2 className="w-4 h-4" /> Audio Finished
                      </Button>
                    )}
                    {isPlaying && (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Now playing…
                      </div>
                    )}
                  </div>
                  {!hasPlayed && (
                    <p className="text-xs text-slate-400 mt-3">
                      👆 Press <strong>Play Audio</strong> to hear the recording. You can only listen to it once.
                    </p>
                  )}
                </div>

                {/* Shared diagram panel */}
                {selectedTask.sharedImage && (
                  <SharedImagePanel image={selectedTask.sharedImage} isPlaying={isPlaying} />
                )}

                {/* Transcript */}
                {scriptVisible && (
                  <div className="mt-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 max-h-60 overflow-y-auto space-y-3">
                    {scriptParagraphs.map((para, i) => (
                      <p key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {para.map((wordObj, j) => {
                          const isHighlighted = isPlaying && wordObj.start === activeWordStart;
                          return (
                            <React.Fragment key={j}>
                              {isHighlighted ? (
                                <mark className="bg-[#7B61FF]/30 text-indigo-900 dark:bg-[#7B61FF]/50 dark:text-white rounded px-1 transition-colors">
                                  {wordObj.text}
                                </mark>
                              ) : wordObj.text}
                              {wordObj.space}
                            </React.Fragment>
                          );
                        })}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/10 flex-shrink-0">
              <CardContent className="p-5 flex gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-2">Testing Tips</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400/80 space-y-1.5 list-disc list-inside">
                    <li>Read all questions and study diagrams <strong>before</strong> pressing play.</li>
                    <li>In the real exam you hear the recording <strong>once only</strong>.</li>
                    <li>For <strong>map/plan tasks</strong>: identify key landmarks first.</li>
                    <li>For <strong>diagram labelling</strong>: use the word bank — spelling counts.</li>
                    <li>Answer while listening — don't wait until the end.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Questions */}
          <Card className="w-full lg:w-[60%] border border-slate-200 dark:border-slate-800 shadow-sm
            bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between
              items-center bg-slate-50/50 dark:bg-slate-900/50 z-10">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Questions</h3>
              <Badge
                variant="secondary"
                className={`font-medium ${
                  answeredCount === selectedTask.questions.length
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {answeredCount} / {selectedTask.questions.length} Answered
              </Badge>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-8">
              {selectedTask.questions.map((question) => (
                <div key={question.id} className="space-y-3">
                  {/* Question type badge */}
                  {questionTypeBadge(question.type)}

                  <h4 className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    {question.text}
                  </h4>

                  {/* Image-based question types */}
                  {(question.type === 'image_label' || question.type === 'image_map' || question.type === 'image_match') && (
                    <ImageQuestionBlock
                      question={question}
                      answer={answers[question.id] || ''}
                      onAnswer={(val) => handleFormInput(question.id, val)}
                    />
                  )}

                  {/* Standard MCQ */}
                  {question.type === 'mcq' && question.options && (
                    <div className="grid grid-cols-1 gap-3">
                      {question.options.map((option) => {
                        const isSelected = answers[question.id] === option.id;
                        return (
                          <div
                            key={option.id}
                            onClick={() => handleOptionSelect(question.id, option.id)}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center
                              ${isSelected
                                ? 'border-[#7B61FF] bg-indigo-50 dark:border-[#7B61FF] dark:bg-[#7B61FF]/10'
                                : 'border-slate-200 bg-white hover:border-[#7B61FF]/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#7B61FF]/50'
                              }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-colors
                              ${isSelected ? 'border-[#7B61FF]' : 'border-slate-300 dark:border-slate-600'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#7B61FF]" />}
                            </div>
                            <span className={`text-sm ${isSelected ? 'text-indigo-900 font-medium dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                              {option.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Form / short answer */}
                  {question.type === 'form' && (
                    <div className="space-y-2">
                      {question.hint && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">💬 {question.hint}</p>
                      )}
                      <input
                        type="text"
                        value={answers[question.id] || ''}
                        onChange={e => handleFormInput(question.id, e.target.value)}
                        placeholder="Type your answer here…"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700
                          bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm
                          placeholder-slate-400 dark:placeholder-slate-500 outline-none
                          focus:border-[#7B61FF] dark:focus:border-[#7B61FF] transition-colors"
                      />
                    </div>
                  )}

                  {/* Hint for image questions */}
                  {(question.type === 'image_label' || question.type === 'image_map') && question.hint && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                      💬 {question.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ── RESULTS VIEW ───────────────────────────────────────────────────────────

  const renderResults = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => setScreen('home')}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white
            hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
        </Button>
      </div>

      <div className="bg-[#7B61FF] rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-indigo-200 text-sm font-medium uppercase tracking-widest mb-2">Overall Results</p>
            <h2 className="text-3xl font-bold">{totalCorrect} / {totalQ} Correct</h2>
            <p className="text-indigo-100 mt-1 text-sm">
              Across {allResults.length} section{allResults.length !== 1 ? 's' : ''} completed
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 text-center min-w-[110px]">
            <p className="text-indigo-200 text-xs uppercase tracking-widest mb-1">Est. Band</p>
            <p className="text-5xl font-black">{band}</p>
          </div>
        </div>
      </div>

      {allResults.map((r) => {
        const task = IELTS_TASKS.find(t => t.id === r.taskId);
        if (!task) return null;
        const sectionCorrect = r.results.filter(q => q.correct).length;
        return (
          <Card key={r.taskId} className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#7B61FF] dark:text-[#9b86ff]">{task.title}</span>
                  <CardTitle className="text-lg text-slate-800 dark:text-slate-100 mt-0.5">{task.topic}</CardTitle>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {sectionCorrect}<span className="text-base font-normal text-slate-400">/{task.questions.length}</span>
                  </p>
                  <button
                    onClick={() => openTask(task)}
                    className="flex items-center gap-1 text-xs text-[#7B61FF] dark:text-[#9b86ff] mt-1 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" /> Retry
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {r.results.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border-l-4 ${
                    q.correct
                      ? 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                      : 'border-l-red-400 bg-red-50 dark:bg-red-900/10'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {q.correct
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {questionTypeBadge(q.type)}
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{q.text}</p>
                      {/* Show thumbnail for image questions in results */}
                      {q.image && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-32">
                          <img src={q.image.src} alt={q.image.alt} className="w-full object-contain max-h-32" />
                        </div>
                      )}
                      <p className={`text-xs mt-1 ${q.correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        Your answer: <strong>{q.userAnswer}</strong>
                      </p>
                      {!q.correct && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Correct answer: <strong className="text-emerald-700 dark:text-emerald-400">{q.answer}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {allResults.length < IELTS_TASKS.length && (
        <Card className="border border-dashed border-[#7B61FF]/40 bg-indigo-50/30 dark:bg-[#7B61FF]/5 dark:border-[#7B61FF]/20">
          <CardContent className="p-6 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
              Complete all {IELTS_TASKS.length} sections for a full band score estimate.
            </p>
            <Button onClick={() => setScreen('home')} className="bg-[#7B61FF] hover:bg-[#6a50e5] text-white">
              Continue Practising →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (

  <StudentLayout activeTab="listening">
    <div className="max-w-7xl mx-auto w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {screen === 'home' && renderHome()}
      {screen === 'test' && renderTest()}
      {screen === 'results' && renderResults()}
    </div>
  </StudentLayout>
);
}