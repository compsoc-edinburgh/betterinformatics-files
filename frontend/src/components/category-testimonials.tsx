import { Stack } from "@mantine/core";
import { Testimonial } from "../interfaces";
import { TestimonialCard } from "./testimonial-card";

export const CategoryTestimonials: React.FC<{
  testimonials: Testimonial[];
}> = ({ testimonials }) => {
  return (
    <Stack>
      {testimonials.map((testimonial: Testimonial, index: number) => (
        <TestimonialCard
          key={index}
          author_id={testimonial.author_id}
          author_display_name={testimonial.author_display_name}
          slug={testimonial.slug}
          testimonial={testimonial.testimonial}
          year_taken={testimonial.year_taken}
          approval_status={testimonial.approval_status}
        />
      ))}
    </Stack>
  );
};
