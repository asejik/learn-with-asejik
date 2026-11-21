import { getAllCourses } from "@/lib/content";
import { CatalogView } from "@/components/catalog/CatalogView";

export default function HomePage() {
  const courses = getAllCourses();

  return <CatalogView initialCourses={courses} />;
}
