import React, { useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import CourseCard from './CourseCard'

const CourseSection = () => {
  const { allCourses } = useContext(AppContext)

  const randomCourses = useMemo(() => {
    if (!Array.isArray(allCourses) || allCourses.length === 0) return []
    const copy = [...allCourses]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, Math.min(4, copy.length))
  }, [allCourses])

  return (
    <div className='py-16 md:px-40 px-8'>
      <h2 className='text-3xl font-medium text-gray-800'>Learn from the best</h2>
      <p className='text-sm md:text-base text-gray-500 mt-3'>
        Discover our top-rated courses across various categories.<br/>
        From coding and design to business and wellness, our courses are crafted to deliver results.
      </p>

      <div className='grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] px-4 md:px-0 md:my-16 my-10 gap-4'>
        {randomCourses.map((course, id) => <CourseCard key={id} course={course} />)}
      </div>

      <Link to={'/course-list'} onClick={() => scrollTo(0, 0)} className='text-gray-500 border border-gray-500/30 px-10 py-3 rounded'>
        Show all courses
      </Link>
    </div>
  )
}

export default CourseSection