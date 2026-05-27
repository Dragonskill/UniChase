import { universities } from "@/data/universities"
import UniversityCard from "@/components/ui/UniversityCard"

function UniversityList() {
  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="card-pop grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {universities.map((uni) => (
          <UniversityCard key={uni.id} uni={uni} />
        ))}
      </div>
    </div>
  )
}

export default UniversityList
