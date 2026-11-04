import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { OrderQueue } from "@/components/staff/OrderQueue";
import { counterOrders } from "@/server/orders/orders";

export const metadata: Metadata = { title: "Orders | The Square Lounge" };
export const dynamic = "force-dynamic";

export default async function StaffOrdersPage() {
  const { open, recent } = await counterOrders();
  return (
    <div>
      <PageTitle eyebrow="Café" title="Station orders">
        Members order from their phones while they play. Take it to the station, then mark it delivered. Add the total
        to their bill at check-out.
      </PageTitle>
      <OrderQueue open={open} recent={recent} />
    </div>
  );
}
