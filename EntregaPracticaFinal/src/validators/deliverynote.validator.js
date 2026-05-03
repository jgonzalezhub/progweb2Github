import { z } from 'zod';

const workerSchema = z.object({
  name: z.string({ required_error: 'El nombre del trabajador es requerido' }),
  hours: z.number({ required_error: 'Las horas son requeridas' }).positive()
});

export const createDeliveryNoteSchema = z.object({
  body: z
    .object({
      project: z.string({ required_error: 'El proyecto es requerido' }),
      client: z.string().optional(),
      format: z.enum(['material', 'hours'], { required_error: 'El formato es requerido' }),
      description: z.string().optional(),
      workDate: z.coerce.date().optional(),
      // material
      material: z.string().optional(),
      quantity: z.coerce.number().positive().optional(),
      unit: z.string().optional(),
      // hours
      hours: z.coerce.number().positive().optional(),
      workers: z.array(workerSchema).optional()
    })
    .refine(
      (d) => {
        if (d.format === 'material') return d.material && d.quantity;
        return true;
      },
      { message: 'Material y cantidad son requeridos para formato material', path: ['material'] }
    )
    .refine(
      (d) => {
        if (d.format === 'hours') return d.hours || (d.workers && d.workers.length > 0);
        return true;
      },
      { message: 'Horas o trabajadores son requeridos para formato hours', path: ['hours'] }
    )
});
