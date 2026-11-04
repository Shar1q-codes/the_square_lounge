/**
 * The Square Café menu, from the printed menu (Nov 2026). Prices in rupees.
 * The website menu and station ordering both read this file; the server prices every order from
 * it, so change a price here and it applies to new orders straight away. Keep item and option ids
 * stable: past orders keep their own copy of the name and price, but ids link them to the menu.
 */

export type MenuOption = { id: string; label: string; price: number };
export type MenuItem = {
  id: string;
  name: string;
  /** Small print after the name, e.g. "8 pieces". */
  note?: string;
  /** One option for a single price; several for sizes or flavours (Small / Large). */
  options: MenuOption[];
};
export type MenuCategory = { id: string; name: string; items: MenuItem[] };

const one = (price: number): MenuOption[] => [{ id: "regular", label: "", price }];
const sizes = (small: number, large: number): MenuOption[] => [
  { id: "small", label: "Small", price: small },
  { id: "large", label: "Large", price: large },
];

export const cafe = {
  name: "The Square Café",
  /** Phone orders and Swiggy / Zomato, as printed on the menu. */
  orderPhone: "8008265433",
  deliveryApps: ["Swiggy", "Zomato"],
  categories: [
    {
      id: "appetizers",
      name: "Appetizers",
      items: [
        { id: "salted-fries", name: "Salted Fries", options: sizes(70, 100) },
        { id: "peri-peri-fries", name: "Peri Peri Fries", options: sizes(80, 120) },
        {
          id: "cheesy-fries",
          name: "Cheesy Fries",
          options: [
            { id: "salted", label: "Salted", price: 130 },
            { id: "peri-peri", label: "Peri Peri", price: 150 },
          ],
        },
        { id: "chicken-loaded-fries", name: "Chicken Loaded Fries", options: one(160) },
        { id: "chicken-salad", name: "Chicken Salad", options: one(180) },
        { id: "nuggets", name: "Nuggets", note: "8 pieces", options: one(110) },
        { id: "chicken-popcorn", name: "Chicken Popcorn", options: sizes(100, 180) },
        { id: "chicken-strips", name: "Chicken Strips", options: sizes(120, 200) },
        { id: "tsl-special-platter", name: "TSL Special Platter", options: one(200) },
      ],
    },
    {
      id: "burgers",
      name: "Burgers",
      items: [
        { id: "veg-patty-burger", name: "Veg Patty Burger", options: one(80) },
        { id: "chicken-burger", name: "Chicken Burger", options: one(90) },
        { id: "paneer-burger", name: "Paneer Burger", options: one(100) },
        { id: "zinger-burger", name: "Zinger Burger", options: one(130) },
        { id: "bbq-burger", name: "BBQ Burger", options: one(140) },
        { id: "mandoes-burger", name: "Mandoes Burger", options: one(180) },
        { id: "thick-cheesy-burger", name: "Thick Cheesy Burger", options: one(190) },
        { id: "tsl-special-burger", name: "TSL Special Burger", options: one(200) },
      ],
    },
    {
      id: "pizza",
      name: "Pizza",
      items: [
        { id: "margherita-pizza", name: "Margherita Pizza", options: one(160) },
        { id: "mix-veg-pizza", name: "Mix Veg Pizza", options: one(160) },
        { id: "chicken-pizza", name: "Chicken Pizza", options: one(170) },
        { id: "paneer-pizza", name: "Paneer Pizza", options: one(180) },
        { id: "bbq-pizza", name: "BBQ Pizza", options: one(180) },
        { id: "tsl-special-pizza", name: "TSL Special Pizza", options: one(240) },
      ],
    },
    {
      id: "wraps",
      name: "Wraps",
      items: [
        { id: "falafel-wrap", name: "Falafel Wrap", options: one(110) },
        { id: "paneer-wrap", name: "Paneer Wrap", options: one(120) },
        { id: "zinger-wrap", name: "Zinger Wrap", options: one(130) },
        { id: "bbq-wrap", name: "BBQ Wrap", options: one(140) },
        { id: "65-wrap", name: "65 Wrap", options: one(140) },
        { id: "thick-cheesy-wrap", name: "Thick Cheesy Wrap", options: one(160) },
        { id: "tsl-special-wrap", name: "TSL Special Wrap", options: one(190) },
      ],
    },
    {
      id: "broasted-chicken",
      name: "Broasted Chicken",
      items: [
        { id: "broasted-2", name: "Broasted Chicken", note: "2 pieces", options: one(160) },
        { id: "broasted-5", name: "Broasted Chicken", note: "5 pieces", options: one(350) },
        { id: "broasted-10", name: "Broasted Chicken", note: "10 pieces", options: one(680) },
      ],
    },
    {
      id: "sandwiches",
      name: "Sandwiches",
      items: [
        { id: "veg-club-sandwich", name: "Veg Club Sandwich", options: one(80) },
        { id: "chicken-club-sandwich", name: "Chicken Club Sandwich", options: one(90) },
        { id: "chicken-grill-sandwich", name: "Chicken Grill Sandwich", options: one(100) },
        { id: "paneer-grill-sandwich", name: "Paneer Grill Sandwich", options: one(120) },
        { id: "cheese-corn-chicken-sandwich", name: "Cheese Corn Chicken Sandwich", options: one(150) },
      ],
    },
  ] satisfies MenuCategory[],
};

/** Every item by id, for pricing orders. */
export const menuItems: ReadonlyMap<string, MenuItem> = new Map(
  cafe.categories.flatMap((c) => c.items.map((item) => [item.id, item] as const)),
);
