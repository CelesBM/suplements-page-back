import { Request, Response } from "express";
import { prisma } from "../app";

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  const userId: number = req.body.verifiedUser.id;
  try {
    const orders = await prisma.order.findMany({
      where: { user: userId },
      include: { shippingDetails: true, items: true },
    });
    res.json({ data: orders });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las órdenes", error });
  }
};

export const createOrder = async (
  req: Request,
  res: Response
): Promise<Response<any, Record<string, any>>> => {
  const userId: number = req.body.verifiedUser.id;
  const { price, shippingCost, total, items, shippingDetails } = req.body;

  try {
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: "El array de productos es inválido" });
    }
    if (!shippingDetails || typeof shippingDetails !== "object") {
      return res.status(400).json({ msg: "Detalles de envío inválidos" });
    }

    const order = await prisma.order.create({
      data: {
        price,
        shippingCost,
        total,
        user: userId,
        shippingDetails: {
          create: {
            name: shippingDetails.name,
            cellphone: shippingDetails.cellphone,
            location: shippingDetails.location,
            address: shippingDetails.address,
          },
        },
      },
    });

    await prisma.item.createMany({
      data: items.map((item) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        title: item.title,
        img: item.img,
        order: order.id,
      })),
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, shippingDetails: true },
    });

    console.log("Orden creada:", {
      price,
      shippingCost,
      total,
      user: userId,
      items,
      shippingDetails,
    });

    return res.status(201).json({ data: fullOrder });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error al crear la orden:", error);
      return res
        .status(500)
        .json({ msg: "Error al crear la orden", error: error.message });
    } else {
      console.error("Error desconocido:", error);
      return res
        .status(500)
        .json({ msg: "Error al crear la orden", error: "Error desconocido" });
    }
  }
};
