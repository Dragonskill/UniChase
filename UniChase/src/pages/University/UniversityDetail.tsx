import { useParams } from "react-router-dom"

function UniversityDetail() {
  const { id } = useParams()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">University Detail</h1>
      <p className="mt-2 text-gray-600">University ID: {id}</p>
    </div>
  )
}

export default UniversityDetail