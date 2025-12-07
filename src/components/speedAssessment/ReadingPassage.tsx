import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PassageData } from "@/lib/reading-api";

interface ReadingPassageProps {
  passage: PassageData;
}

export const ReadingPassage = ({ passage }: ReadingPassageProps) => {
  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
              {passage.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {passage.category}
              </Badge>
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                {passage.difficulty} Level
              </Badge>
              <Badge variant="outline" className="border-green-200 text-green-700">
                {passage.wordCount} Words
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="prose prose-lg max-w-none">
          <div 
            className="text-lg leading-8 text-gray-700 font-medium tracking-wide selection:bg-blue-100 selection:text-blue-900"
            style={{ 
              lineHeight: '1.8',
              fontFamily: 'Georgia, serif',
              textAlign: 'justify'
            }}
          >
            {passage.text.split('\n').map((paragraph, index) => (
              paragraph.trim() ? (
                <p key={index} className="mb-6 first:mt-0 last:mb-0">
                  {paragraph.trim()}
                </p>
              ) : null
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
