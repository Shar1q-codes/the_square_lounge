import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { MyOrders } from "@/components/order/MyOrders";
import { OrderMenu } from "@/components/order/OrderMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cafe } from "@/config/menu";
import { currentGamer } from "@/server/identity/currentUser";
import { ordersForGamer } from "@/server/orders/orders";
import { currentSession } from "@/server/sessions/history";

export const metadata: Metadata = { title: "Order to your station | The Square Lounge" };

export default async function OrderPage() {
  const gamer = await currentGamer();
  const [session, orders] = gamer ? await Promise.all([currentSession(gamer.id), ordersForGamer(gamer.id)]) : [null, []];

  return (
    <div className="grid gap-6">
      <PageTitle eyebrow={cafe.name} title="Order to your station">
        {session
          ? `You're at ${session.stationName}. Pick what you'd like and we'll bring it over. Pay at the counter with your gaming time.`
          : "Members who are checked in to a station can order food from their phone and we'll bring it over."}
      </PageTitle>

      {!gamer ? (
        <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p>Log in to order to your station.</p>
          <div className="flex gap-2">
            <Button href="/login?next=/order" size="sm">
              Log in
            </Button>
            <Button href="/join" size="sm" variant="secondary">
              Join free
            </Button>
          </div>
        </Card>
      ) : (
        !session && (
          <Card className="p-5">
            <p>You&apos;re not checked in to a station yet. Ask at the counter, then order from here.</p>
          </Card>
        )
      )}

      <MyOrders orders={orders} />
      <OrderMenu stationName={session?.stationName ?? null} />
    </div>
  );
}
