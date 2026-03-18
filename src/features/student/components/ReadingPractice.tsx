import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { ArrowLeft, Send, BookOpen, FileText, Info, CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

// --- Types ---
interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface ReadingTask {
  id: string;
  title: string;
  description: string;
  wordCount: number;
  passage: string;
  questions: Question[];
}

// --- Mock Data (Replace with your API fetch) ---
// --- Mock Data (Replace with your API fetch) ---
const MOCK_TASKS: ReadingTask[] = [
  {
    id: '1',
    title: 'Reading Passage 1: The Evolution of the Bicycle',
    description: 'Read the text about the history of bicycles and answer the multiple-choice questions.',
    wordCount: 450,
    passage: `The bicycle is one of the most common and widely used vehicles in the world, yet its history is a complex tale of gradual evolution. The first machine to bear a resemblance to the modern bicycle was the "dandy horse," invented by the German Baron Karl von Drais in 1817. Made almost entirely of wood, it lacked pedals and was propelled by the rider pushing their feet against the ground.

It wasn't until the 1860s that pedals were added to the front wheel, creating what became known as the "velocipede" or "boneshaker." As the latter name suggests, the ride was incredibly uncomfortable due to the stiff wooden wheels and iron bands, paired with the cobblestone roads of the era.

In the 1870s, the quest for higher speeds led to the development of the "Penny Farthing." This iconic bicycle featured a massive front wheel and a tiny rear wheel. Because the pedals were directly attached to the front wheel, a larger wheel meant the bicycle travelled further with each pedal stroke. However, the high seating position made it notoriously dangerous; a small bump could easily send the rider pitching forward over the handlebars.

The true breakthrough came in the late 1880s with the invention of the "safety bicycle." It featured two wheels of equal size and a chain drive that transferred power from the pedals to the rear wheel. Coupled with the invention of pneumatic (air-filled) rubber tires by John Boyd Dunlop in 1888, the bicycle finally became a safe, comfortable, and practical mode of transport for the general public, sparking a massive bicycle boom in the 1890s.`,
    questions: [
      {
        id: 'q1',
        text: '1. How was the "dandy horse" powered?',
        options: [
          { id: 'o1', text: 'By pedals attached to the front wheel' },
          { id: 'o2', text: 'By a chain drive connecting to the rear wheel' },
          { id: 'o3', text: 'By the rider pushing their feet on the ground' },
          { id: 'o4', text: 'By a small steam engine' }
        ]
      },
      {
        id: 'q2',
        text: '2. Why was the velocipede nicknamed the "boneshaker"?',
        options: [
          { id: 'o1', text: 'It had unequal wheel sizes' },
          { id: 'o2', text: 'It was made with uncomfortable wooden wheels and iron bands' },
          { id: 'o3', text: 'It lacked a steering mechanism' },
          { id: 'o4', text: 'It travelled at dangerously high speeds' }
        ]
      },
      {
        id: 'q3',
        text: '3. What was the main danger of riding a Penny Farthing?',
        options: [
          { id: 'o1', text: 'The chain often snapped' },
          { id: 'o2', text: 'The rubber tires punctured easily' },
          { id: 'o3', text: 'Riders could easily fall forward over the handlebars' },
          { id: 'o4', text: 'The brakes were highly unreliable' }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Reading Passage 2: The Intelligence of Corvids',
    description: 'Explore the surprising cognitive abilities of crows and ravens.',
    wordCount: 380,
    passage: `For centuries, birds in the corvid family—which includes crows, ravens, jays, and magpies—have been featured in folklore and mythology. Modern science has recently caught up with these legends, revealing that corvids possess an astonishing level of intelligence, rivalling that of great apes.

One of the most remarkable traits of corvids is their ability to manufacture and use tools. New Caledonian crows, for instance, have been observed snapping twigs and shaping them into hooks to extract insects from deep crevices in tree bark. Furthermore, they pass these tool-making techniques down to their offspring, demonstrating a form of cultural transmission.

Corvids also excel in problem-solving and memory. Studies have shown that crows can remember human faces for years, holding grudges against people who have threatened them and teaching other crows in their flock to recognize the "dangerous" individuals.`,
    questions: [
      {
        id: 'q1',
        text: '1. Which of the following birds is NOT mentioned as a member of the corvid family?',
        options: [
          { id: 'o1', text: 'Crows' },
          { id: 'o2', text: 'Ravens' },
          { id: 'o3', text: 'Parrots' },
          { id: 'o4', text: 'Magpies' }
        ]
      },
      {
        id: 'q2',
        text: '2. How do New Caledonian crows extract insects from tree bark?',
        options: [
          { id: 'o1', text: 'By using their sharp claws' },
          { id: 'o2', text: 'By shaping twigs into hooks' },
          { id: 'o3', text: 'By dropping stones into the crevices' },
          { id: 'o4', text: 'By mimicking insect sounds' }
        ]
      }
    ]
  },
  {
    id: '3',
    title: 'Reading Passage 3: Ancient Roman Aqueducts',
    description: 'Discover the engineering marvels that supplied water to the ancient Roman Empire.',
    wordCount: 410,
    passage: `The aqueducts of ancient Rome stand as a testament to the extraordinary engineering prowess of the Roman Empire. Designed to transport fresh water from distant sources into cities and towns, these structures were vital for public baths, latrines, fountains, and private households. 

While the iconic above-ground stone arches are the most recognizable feature of aqueducts today, it is a misconception that they were built entirely this way. In fact, over 80% of the Roman aqueduct system was built underground. Subterranean pipes protected the water from contamination, kept it cool, and prevented structural damage from weather or enemies. 

Gravity was the sole force powering the movement of water. Roman engineers meticulously calculated a constant, shallow downward gradient along the entire route. If a valley was too deep to cross with a standard arched bridge, they utilized an inverted siphon system. This involved piping the water down into the valley and relying on the resulting pressure to push it up the other side. 

The maintenance of these systems was a massive undertaking, requiring dedicated teams of workers known as 'aquarii'. They had to regularly clear the channels of calcium buildup and debris to ensure a steady flow, proving that Roman administrative organization was just as impressive as their engineering.`,
    questions: [
      {
        id: 'q1',
        text: '1. What percentage of the Roman aqueduct system was built underground?',
        options: [
          { id: 'o1', text: 'Exactly 50%' },
          { id: 'o2', text: 'Less than 20%' },
          { id: 'o3', text: 'More than 80%' },
          { id: 'o4', text: '100%' }
        ]
      },
      {
        id: 'q2',
        text: '2. What force was used to move water through the aqueducts?',
        options: [
          { id: 'o1', text: 'Wind power' },
          { id: 'o2', text: 'Gravity' },
          { id: 'o3', text: 'Water wheels' },
          { id: 'o4', text: 'Manual labor' }
        ]
      },
      {
        id: 'q3',
        text: '3. What was the primary purpose of the "aquarii"?',
        options: [
          { id: 'o1', text: 'To design new aqueduct routes' },
          { id: 'o2', text: 'To defend the water supply from enemies' },
          { id: 'o3', text: 'To maintain and clean the water channels' },
          { id: 'o4', text: 'To distribute water to private households' }
        ]
      }
    ]
  },
  {
    id: '4',
    title: 'Reading Passage 4: The Psychology of Color in Marketing',
    description: 'Analyze how brands use color theory to influence consumer behavior and decision-making.',
    wordCount: 395,
    passage: `In the highly competitive world of marketing, visual identity is paramount. One of the most subtle yet powerful tools at a marketer’s disposal is color psychology—the study of how colors affect human behavior and decision-making. Research indicates that up to 90% of snap judgments made about products can be based on color alone.

Red is widely known to stimulate urgency and appetite. It increases heart rate and creates a sense of immediacy, which is why it is frequently used by fast-food chains and for clearance sales. In contrast, blue is associated with tranquility, trust, and security. Financial institutions and tech companies, such as banks and social media platforms, often utilize blue logos to instill a sense of reliability in their users.

Green, naturally tied to the environment, is the go-to color for brands wishing to promote sustainability, health, or organic ingredients. However, the cultural context of color must never be ignored. While white symbolizes purity and weddings in Western cultures, it is often associated with mourning and funerals in many Eastern cultures. Therefore, global brands must carefully adapt their color palettes to align with local psychological associations to avoid marketing blunders.`,
    questions: [
      {
        id: 'q1',
        text: '1. According to the text, why do fast-food chains often use the color red?',
        options: [
          { id: 'o1', text: 'Because it is the cheapest dye available' },
          { id: 'o2', text: 'Because it symbolizes purity and health' },
          { id: 'o3', text: 'Because it stimulates urgency and appetite' },
          { id: 'o4', text: 'Because it instills trust in the consumer' }
        ]
      },
      {
        id: 'q2',
        text: '2. Why is cultural context important for global brands choosing colors?',
        options: [
          { id: 'o1', text: 'Because colors look different in different climates' },
          { id: 'o2', text: 'Because a color can have entirely different meanings in different cultures' },
          { id: 'o3', text: 'Because some countries have banned certain colors in advertising' },
          { id: 'o4', text: 'Because Eastern cultures prefer brighter colors than Western cultures' }
        ]
      }
    ]
  },
  {
    id: '5',
    title: 'Reading Passage 5: The Impact of Microplastics',
    description: 'Understand the environmental consequences of microscopic plastic pollution in our oceans.',
    wordCount: 430,
    passage: `Microplastics, defined as plastic fragments smaller than five millimeters in length, have become one of the most pervasive environmental pollutants of the 21st century. These tiny particles originate from a variety of sources. "Primary" microplastics are manufactured specifically for use in products like cosmetics and synthetic clothing. "Secondary" microplastics result from the breakdown of larger plastic items, such as water bottles and fishing nets, due to exposure to ultraviolet radiation and ocean waves.

The infiltration of microplastics into marine ecosystems is a matter of profound concern. Because of their size, they are easily ingested by a wide array of marine life, from microscopic zooplankton to massive baleen whales. Once ingested, these plastics can cause physical blockages in the digestive tracts of animals, leading to starvation. 

Furthermore, microplastics act like chemical sponges in the ocean, absorbing toxic pollutants such as pesticides and heavy metals from the surrounding water. When marine animals consume these plastics, the toxins can bioaccumulate, moving up the food chain and eventually ending up in seafood consumed by humans. While the long-term health effects of microplastic ingestion on humans are still being studied, the consensus among marine biologists is that drastic reductions in global plastic production are urgently required.`,
    questions: [
      {
        id: 'q1',
        text: '1. What is the difference between primary and secondary microplastics?',
        options: [
          { id: 'o1', text: 'Primary are larger than secondary' },
          { id: 'o2', text: 'Primary are manufactured at that size, secondary break down from larger items' },
          { id: 'o3', text: 'Primary are found in oceans, secondary are found on land' },
          { id: 'o4', text: 'Primary are toxic, secondary are harmless' }
        ]
      },
      {
        id: 'q2',
        text: '2. How do microplastics cause starvation in marine life?',
        options: [
          { id: 'o1', text: 'They destroy the natural food sources of the animals' },
          { id: 'o2', text: 'They cause physical blockages in the digestive tracts' },
          { id: 'o3', text: 'They alter the animals sense of taste' },
          { id: 'o4', text: 'They make the animals too heavy to hunt' }
        ]
      },
      {
        id: 'q3',
        text: '3. What happens when microplastics absorb toxic pollutants?',
        options: [
          { id: 'o1', text: 'The toxins are neutralized by the plastic' },
          { id: 'o2', text: 'The plastic sinks to the bottom of the ocean' },
          { id: 'o3', text: 'The toxins can bioaccumulate and move up the food chain' },
          { id: 'o4', text: 'The plastic rapidly dissolves in the water' }
        ]
      }
    ]
  },
  {
    id: '6',
    title: 'Reading Passage 6: Sleep Architecture',
    description: 'A scientific look at the stages of the human sleep cycle and their functions.',
    wordCount: 380,
    passage: `Sleep is not a uniform state of rest, but rather a dynamic process characterized by distinct stages. This structure, often referred to as "sleep architecture," is divided into two broad categories: Non-Rapid Eye Movement (NREM) sleep and Rapid Eye Movement (REM) sleep.

A typical night's sleep consists of four to five cycles, each lasting approximately 90 to 110 minutes. NREM sleep makes up the majority of the cycle and is further broken down into three stages. Stage 1 is the lightest phase of sleep, where a person can be easily awakened. Stage 2 features a drop in body temperature and heart rate. Stage 3, known as deep sleep or slow-wave sleep, is crucial for physical restoration, tissue repair, and the strengthening of the immune system.

Following deep NREM sleep, the body transitions into REM sleep. During this phase, brain activity increases significantly, closely resembling that of a waking state. REM sleep is heavily associated with vivid dreaming, emotional regulation, and memory consolidation. Interestingly, while the brain is highly active, the major voluntary muscles of the body undergo a temporary paralysis, a mechanism thought to prevent individuals from physically acting out their dreams.`,
    questions: [
      {
        id: 'q1',
        text: '1. Which stage of sleep is most important for physical restoration and tissue repair?',
        options: [
          { id: 'o1', text: 'Stage 1 NREM' },
          { id: 'o2', text: 'Stage 2 NREM' },
          { id: 'o3', text: 'Stage 3 NREM (Deep sleep)' },
          { id: 'o4', text: 'REM sleep' }
        ]
      },
      {
        id: 'q2',
        text: '2. What happens to voluntary muscles during REM sleep?',
        options: [
          { id: 'o1', text: 'They twitch uncontrollably' },
          { id: 'o2', text: 'They become temporarily paralyzed' },
          { id: 'o3', text: 'They physically act out the dream' },
          { id: 'o4', text: 'They grow stronger' }
        ]
      }
    ]
  },
  {
    id: '7',
    title: 'Reading Passage 7: The Waggle Dance of Bees',
    description: 'Investigate how honeybees communicate complex navigational data through movement.',
    wordCount: 405,
    passage: `One of the most remarkable forms of animal communication is the "waggle dance" performed by the honeybee (Apis mellifera). Discovered and decoded by Austrian ethologist Karl von Frisch in the mid-20th century, this intricate figure-eight movement allows a foraging bee to communicate the precise location of a lucrative food source to its hive mates.

When a scout bee returns to the dark, vertical comb of the hive, it begins its dance. The direction of the food source is communicated by the angle of the dance in relation to the vertical. For instance, if the bee dances pointing straight up, it means the food is in the exact direction of the sun. If it dances at a 45-degree angle to the right of vertical, the food is located 45 degrees to the right of the sun.

The distance to the food source is conveyed through the duration of the "waggle run"—the central straight portion of the figure-eight where the bee shakes its abdomen. A longer waggle run indicates a greater distance. Furthermore, the intensity and enthusiasm of the dance correlate with the quality of the nectar; a very vigorous dance signals a particularly rich food source, prompting more bees to deploy to that specific location.`,
    questions: [
      {
        id: 'q1',
        text: '1. Who originally decoded the waggle dance of the honeybee?',
        options: [
          { id: 'o1', text: 'Charles Darwin' },
          { id: 'o2', text: 'Karl von Frisch' },
          { id: 'o3', text: 'Albert Einstein' },
          { id: 'o4', text: 'John Boyd Dunlop' }
        ]
      },
      {
        id: 'q2',
        text: '2. What does a waggle dance pointing straight up on the honeycomb indicate?',
        options: [
          { id: 'o1', text: 'The food is located high in a tree' },
          { id: 'o2', text: 'The food is exactly in the opposite direction of the sun' },
          { id: 'o3', text: 'The food is in the exact direction of the sun' },
          { id: 'o4', text: 'The food source is depleted' }
        ]
      },
      {
        id: 'q3',
        text: '3. How does the dancing bee indicate the distance to the food?',
        options: [
          { id: 'o1', text: 'By the angle of the dance' },
          { id: 'o2', text: 'By the loudness of its buzzing' },
          { id: 'o3', text: 'By the duration of the waggle run' },
          { id: 'o4', text: 'By the number of loops in the figure-eight' }
        ]
      }
    ]
  },
  {
    id: '8',
    title: 'Reading Passage 8: The Rise of Vertical Farming',
    description: 'Read about an innovative agricultural technique addressing global food security.',
    wordCount: 420,
    passage: `As the global population accelerates towards an estimated 9.7 billion by 2050, traditional agriculture faces unprecedented pressure. Arable land is diminishing due to urbanization and soil degradation, while climate change brings unpredictable weather patterns. In response, a revolutionary approach known as "vertical farming" has emerged as a potential solution to food security challenges.

Vertical farming involves growing crops in stacked layers within a controlled indoor environment, often utilizing abandoned warehouses or skyscrapers. By utilizing hydroponic or aeroponic systems, these farms grow plants without soil, delivering nutrient-rich water directly to the roots. 

The advantages are substantial. Because they operate indoors, vertical farms are completely immune to weather events like droughts or floods, allowing for year-round crop production. Furthermore, they use up to 95% less water than conventional farming. By locating these farms within urban centers, the food miles—the distance food travels from farm to plate—are drastically reduced, lowering carbon emissions and ensuring fresher produce for city dwellers.

However, the industry faces hurdles. The initial capital required to set up the infrastructure, particularly the complex LED lighting systems required for photosynthesis, is exceedingly high. Additionally, the energy consumption needed to power the climate control and lighting systems 24/7 remains a significant environmental and economic challenge that the sector must overcome.`,
    questions: [
      {
        id: 'q1',
        text: '1. Why is traditional arable land diminishing?',
        options: [
          { id: 'o1', text: 'Due to excessive rainfall and flooding' },
          { id: 'o2', text: 'Due to urbanization and soil degradation' },
          { id: 'o3', text: 'Because people prefer to live in rural areas' },
          { id: 'o4', text: 'Because of the rise in vertical farming' }
        ]
      },
      {
        id: 'q2',
        text: '2. How do vertical farms reduce "food miles"?',
        options: [
          { id: 'o1', text: 'By using faster delivery trucks' },
          { id: 'o2', text: 'By growing food that lasts longer' },
          { id: 'o3', text: 'By being located within urban centers near consumers' },
          { id: 'o4', text: 'By exporting food to other countries' }
        ]
      },
      {
        id: 'q3',
        text: '3. What is mentioned as a major challenge for vertical farming?',
        options: [
          { id: 'o1', text: 'High energy consumption and setup costs' },
          { id: 'o2', text: 'Lack of consumer interest in indoor-grown food' },
          { id: 'o3', text: 'Inability to grow crops year-round' },
          { id: 'o4', text: 'Excessive water usage' }
        ]
      }
    ]
  }
];

export default function ReadingPractice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Task State
  const [selectedTask, setSelectedTask] = useState<ReadingTask | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    setSelectedTask(null);
    setAnswers({}); // Clear answers when going back
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (selectedTask && Object.keys(answers).length < selectedTask.questions.length) {
      toast({ 
        title: 'Incomplete Test', 
        description: 'Please answer all questions before submitting.', 
        variant: 'destructive' 
      });
      return;
    }

    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: 'Success!', description: 'Reading test submitted successfully for grading.' });
      handleBack();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar 
        activeTab="reading" 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* --- VIEW 1: Card Selection Screen --- */}
          {!selectedTask ? (
            <div className="space-y-8 h-full">
              
              {/* --- NEW COLORED BANNER --- */}
              <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
                    IELTS Reading Practice <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
                  </h1>
                  <p className="text-indigo-50 max-w-2xl text-base md:text-lg leading-relaxed mb-6">
                    Enhance your reading comprehension with timed passages and targeted questions. Select a module below to practice your skimming, scanning, and detail-oriented reading to push for a band 7+.
                  </p>
                  
                  {/* <div className="flex gap-3">
                     <Button className="bg-white text-[#7B61FF] hover:bg-slate-100 font-semibold rounded-full px-6 shadow-sm">
                       Review Past Tests
                     </Button>
                  </div> */}
                </div>
              </div>

              {MOCK_TASKS.length === 0 ? (
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <CardTitle className="text-lg text-slate-700 dark:text-slate-200">No Tasks Yet</CardTitle>
                  <CardDescription className="dark:text-slate-400">Your instructor hasn't assigned any reading tasks currently.</CardDescription>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {MOCK_TASKS.map((task) => (
                    <Card 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md hover:border-[#7B61FF] dark:hover:border-[#7B61FF] transition-all cursor-pointer flex flex-col h-64 group"
                    >
                      <CardHeader className="pb-3 flex-none">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#7B61FF] dark:group-hover:text-[#9b86ff] transition-colors line-clamp-2">
                            {task.title}
                          </CardTitle>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className="bg-indigo-50 text-[#7B61FF] hover:bg-indigo-100 dark:bg-[#7B61FF]/20 dark:text-[#9b86ff] flex-shrink-0">
                              New
                            </Badge>
                            <span className="text-xs font-semibold text-slate-400 flex items-center">
                              <FileText className="w-3 h-3 mr-1" /> {task.wordCount} words
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-grow overflow-hidden pb-4">
                        <p className="text-slate-600 dark:text-slate-400 text-sm flex-grow line-clamp-4">
                          {task.description}
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-500">
                          <span>{task.questions.length} Questions</span>
                          <span className="text-[#7B61FF] dark:text-[#9b86ff] flex items-center group-hover:translate-x-1 transition-transform">
                            Start Reading <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            
            /* --- VIEW 2: Split Screen Test Interface --- */
            <div className="flex flex-col h-full flex-1 min-h-[calc(100vh-140px)]">
              {/* Header - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2 w-fit"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Passages
                </Button>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="bg-[#7B61FF] hover:bg-[#6a50e5] text-white shadow-sm w-full sm:w-auto"
                >
                  {submitting ? (
                    <span className="flex items-center">Submitting...</span>
                  ) : (
                    <span className="flex items-center"><Send className="w-4 h-4 mr-2" /> Submit Answers</span>
                  )}
                </Button>
              </div>

              {/* Split Content Area */}
              <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">
                
                {/* Left Section: Reading Passage */}
                <div className="w-full lg:w-[50%] xl:w-[55%] flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar">
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex-shrink-0">
                    <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[#7B61FF] dark:text-[#9b86ff] mb-2">
                        <BookOpen className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Reading Passage</span>
                      </div>
                      <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                        {selectedTask.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="text-slate-700 dark:text-slate-300 text-base leading-loose whitespace-pre-line font-medium">
                        {selectedTask.passage}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 flex-shrink-0 mb-4">
                    <CardContent className="p-5 flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-1">Testing Tips</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-400/80 list-disc list-inside space-y-1.5">
                          <li>Read the questions first to know what information to look for.</li>
                          <li>Skim the passage quickly to get the general idea, then read in detail.</li>
                          <li>Scroll this panel independently to refer back to the text while answering.</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Section: Questionnaire */}
                <Card className="w-full lg:w-[50%] xl:w-[45%] border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 z-10">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Multiple Choice Questions</h3>
                    <Badge 
                      variant="secondary"
                      className={`font-medium ${
                        Object.keys(answers).length === selectedTask.questions.length 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {Object.keys(answers).length} / {selectedTask.questions.length} Answered
                    </Badge>
                  </div>
                  
                  {/* Questions Scrollable Area */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {selectedTask.questions.map((question) => (
                      <div key={question.id} className="space-y-4">
                        <h4 className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                          {question.text}
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {question.options.map((option) => {
                            const isSelected = answers[question.id] === option.id;
                            return (
                              <div
                                key={option.id}
                                onClick={() => handleOptionSelect(question.id, option.id)}
                                className={`
                                  relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center
                                  ${isSelected 
                                    ? 'border-[#7B61FF] bg-indigo-50 dark:border-[#7B61FF] dark:bg-[#7B61FF]/10' 
                                    : 'border-slate-200 bg-white hover:border-[#7B61FF]/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#7B61FF]/50'
                                  }
                                `}
                              >
                                <div className={`
                                  w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-colors
                                  ${isSelected 
                                    ? 'border-[#7B61FF] dark:border-[#7B61FF]' 
                                    : 'border-slate-300 dark:border-slate-600'
                                  }
                                `}>
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#7B61FF] dark:bg-[#7B61FF]" />}
                                </div>
                                <span className={`text-sm ${isSelected ? 'text-indigo-900 font-medium dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {option.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}