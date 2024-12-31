"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "./auth";
import { supabase } from "./supabase";
import { getBookings } from "./data-service";
import { redirect } from "next/navigation";


export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateProfile(formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const nationalID = formData.get("nationalID");
  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID)) {
    throw new Error("Please provide a valid national ID");
  }

  const updatedData = { nationality, countryFlag, nationalID };
  const { error } = await supabase
    .from("guests")
    .update(updatedData)
    .eq("id", session.user.guestId);

  if (error) {
    throw new Error("Guest profile could not be updated");
  }

  revalidatePath("/account/profile");
}

export async function deleteReservation(bookingId) {
  const session = auth();
  if (!session) throw new Error("You must be logged in");

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(bookingId)) {
    throw new Error("You are not allowed to delete this booking");
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) {
    throw new Error("Booking could not be deleted");
  }

  revalidatePath("/account/reservations");
}

export async function updateReservation(formData) {
  // authentication
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  // authorization
  const reservationId = Number(formData.get("reservationId"));

  const guestReservations = await getBookings(session.user.guestId);
  const guestReservationIds = guestReservations.map((booking) => booking.id);

  if (!guestReservationIds.includes(reservationId)) {
    throw new Error("You are not allowed to update this reservation");
  }

  // build updated data
  const updatedData = {
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
  };
  // mutation
  const { error } = await supabase
    .from("bookings")
    .update(updatedData)
    .eq("id", reservationId);

  // error handling
  if (error) {
    throw new Error("The reservation could not be updated");
  }

  // revalidation
  revalidatePath("/account/reservations");
  revalidatePath(`/account/reservations/edit/${reservationId}`);

  // redirect
  redirect("/account/reservations");
}

export async function createReservation(reservationData, formData) {
  // authentication
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const newBooking = {
    ...reservationData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get('numGuests')),
    observations: formData.get('observations').slice(0, 1000),
    extrasPrice: 0,
    totalPrice: reservationData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: 'unconfirmed',
  };

  const {error} = await supabase.from('bookings').insert([newBooking]);

  if (error) {
    throw new Error('Reservation could not be created');
  }

  revalidatePath(`/cabins/${reservationData.cabinId}`);
  redirect('/cabins/thankyou');
}
