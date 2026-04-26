import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function TicketStockDisplay({ ticketType, sold, available, total }) {
  const percentage = (sold / total) * 100;
  const remaining = available - sold;
  const isSoldOut = remaining <= 0;

  return (
    <Card className={`${isSoldOut ? "opacity-50" : ""}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900">{ticketType}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {isSoldOut ? "Complet" : `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
            </p>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {sold}/{total}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
          <span>{Math.round(percentage)}% vendu</span>
          <span>{total - sold} places disponibles</span>
        </div>
      </CardContent>
    </Card>
  );
}
