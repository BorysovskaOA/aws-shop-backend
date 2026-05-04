import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Book, BookInStock } from "product-service/src/interfaces";
import "dotenv/config";

if (!process.env.PRODUCTS_TABLE || !process.env.STOCKS_TABLE) {
  throw new Error("Cannot proceed withot table names");
}

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const books: Book[] = [
  {
    description:
      "The epic journey of Frodo Baggins to destroy the One Ring in Mount Doom.",
    id: "f982d625-728b-449e-97e2-45e07661b0c0",
    price: 25,
    title: "The Fellowship of the Ring",
  },
  {
    description:
      "A noble family navigates the deadly politics of Westeros as winter approaches.",
    id: "37497166-508b-4a54-946d-96f30d06144e",
    price: 30,
    title: "A Game of Thrones",
  },
  {
    description:
      "A young boy discovers he is a wizard and begins his education at Hogwarts.",
    id: "672a912c-7389-4d69-8e41-0731eb1f94d0",
    price: 20,
    title: "Harry Potter and the Philosopher's Stone",
  },
  {
    description:
      "Geralt of Rivia, a monster hunter, seeks his destiny in a war-torn world.",
    id: "180b06c1-a590-4a87-8828-56948a38615b",
    price: 22,
    title: "The Last Wish",
  },
  {
    description:
      "Four siblings discover a magical wardrobe leading to the land of Narnia.",
    id: "060d4734-7548-430c-9941-6927d627341e",
    price: 18,
    title: "The Lion, the Witch and the Wardrobe",
  },
  {
    description:
      "A young man recounts his life story and his journey to become a legendary wizard.",
    id: "4e1a0b32-c64a-4638-9584-633890f576e3",
    price: 28,
    title: "The Name of the Wind",
  },
  {
    description:
      "In a world of constant ashfall, a street urchin joins a crew to overthrow an immortal ruler.",
    id: "5961e687-d576-466d-8857-e6f6630f5a7a",
    price: 24,
    title: "Mistborn: The Final Empire",
  },
  {
    description:
      "The farm boy Rand al'Thor discovers he is the Dragon Reborn, destined to save or destroy the world.",
    id: "2245b73d-9d41-4828-98e8-b80c55497210",
    price: 35,
    title: "The Eye of the World",
  },
  {
    description:
      "A young girl named Lyra travels to the frozen North to save her friend and discover the truth about 'Dust'.",
    id: "a9094770-498c-4043-8f0a-6e540d997232",
    price: 19,
    title: "Northern Lights",
  },
  {
    description:
      "A street thief in the city of Camorr balances his life of crime with a mysterious threat from his past.",
    id: "7585f67a-f38b-4977-9065-981881f1816f",
    price: 26,
    title: "The Lies of Locke Lamora",
  },
];

const booksInStock: BookInStock[] = [
  {
    productId: "f982d625-728b-449e-97e2-45e07661b0c0",
    count: 2,
  },
  {
    productId: "37497166-508b-4a54-946d-96f30d06144e",
    count: 3,
  },
  {
    productId: "672a912c-7389-4d69-8e41-0731eb1f94d0",
    count: 2,
  },
  {
    productId: "180b06c1-a590-4a87-8828-56948a38615b",
    count: 4,
  },
  {
    productId: "060d4734-7548-430c-9941-6927d627341e",
    count: 3,
  },
  {
    productId: "4e1a0b32-c64a-4638-9584-633890f576e3",
    count: 3,
  },
  {
    productId: "5961e687-d576-466d-8857-e6f6630f5a7a",
    count: 4,
  },
  {
    productId: "2245b73d-9d41-4828-98e8-b80c55497210",
    count: 2,
  },
  {
    productId: "a9094770-498c-4043-8f0a-6e540d997232",
    count: 3,
  },
  {
    productId: "7585f67a-f38b-4977-9065-981881f1816f",
    count: 4,
  },
];

async function fillTables() {
  for (const book of books) {
    const bookInStock = booksInStock.find(
      (b: BookInStock) => b.productId === book.id,
    );
    try {
      await docClient.send(
        new PutCommand({
          TableName: process.env.PRODUCTS_TABLE,
          Item: {
            id: book.id,
            title: book.title,
            description: book.description,
            price: book.price,
          },
        }),
      );

      await docClient.send(
        new PutCommand({
          TableName: process.env.STOCKS_TABLE,
          Item: {
            product_id: book.id,
            count: bookInStock?.count || 0,
          },
        }),
      );

      console.log(
        `Added: ${book.title} (ID: ${book.id}) (IN_STOCK: ${bookInStock?.count || 0})`,
      );
    } catch (err) {
      console.error(`Failed to add ${book.title}:`, err);
    }
  }
}

fillTables();
