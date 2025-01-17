import { WeatherCard } from "@/components/weather/WeatherCard";
import { WindCard } from "@/components/weather/WindCard";
import { WeatherForecast } from "@/components/weather/WeatherForecast";
import { ActivityCard } from "@/components/weather/ActivityCard";
import { AllergyCard } from "@/components/weather/AllergyCard";

// Typen für die Wetterdaten
interface WindData {
  windSpeed: number;
  windDirection: string;
  gustSpeed: number;
  windChill: number;
}

// Mock-Daten in einem separaten Objekt
const mockData = {
  wind: {
    windSpeed: 15,
    windDirection: "NO",
    gustSpeed: 25,
    windChill: 18
  },
  activities: {
    outdoorSuitability: {
      walking: { score: 8, recommendation: "Ideale Bedingungen für Spaziergänge" },
      sports: { score: 7, recommendation: "Gut geeignet, auf ausreichend Flüssigkeit achten" },
      elderly: { score: 6, recommendation: "Moderate Aktivität möglich, Mittagshitze meiden" }
    },
    warningLevel: "moderate" as const,
    warningText: "Erhöhte UV-Strahlung zwischen 11-15 Uhr"
  },
  allergy: {
    pollen: {
      grass: { level: "mittel" as const, trend: "steigend" as const },
      trees: { level: "hoch" as const, trend: "gleichbleibend" as const },
      weeds: { level: "niedrig" as const, trend: "fallend" as const }
    },
    humidity: 65,
    windSpeed: 15
  }
};

export default function WeatherPage() {
  return (
    <main className="space-y-4 p-4">
      {/* Hauptwetter-Sektion: 2 Karten */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeatherCard />
        <WeatherForecast />
      </section>
      
      {/* Detaillierte Wetterdaten: 3 Karten */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WindCard {...mockData.wind} />
        <ActivityCard {...mockData.activities} />
        <AllergyCard {...mockData.allergy} />
      </section>
    </main>
  );
} 