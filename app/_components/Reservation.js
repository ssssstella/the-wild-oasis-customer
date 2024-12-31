import DateSelector from "@/app/_components/DateSelector";
import ReservationForm from "@/app/_components/ReservationForm";
import { getBookedDatesByCabinId, getSettings } from "../_lib/data-service";
import { auth } from "../_lib/auth";
import LoginMessage from "@/app/_components/LoginMessage";

async function Reservation({ cabin }) {
  const [settings, bookedDates] = await Promise.all([
    getSettings(),
    getBookedDatesByCabinId(cabin.id),
  ]);

  const session = await auth();

  return (
    <div className="grid min-h-[400px] grid-cols-2 border border-primary-800">
      <DateSelector
        settings={settings}
        cabin={cabin}
        bookedDates={bookedDates}
      />
     {session?.user ? <ReservationForm cabin={cabin} user={session.user} /> : <LoginMessage />}
    </div>
  );
}

export default Reservation;