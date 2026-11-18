import json
from typing import List, Dict, Any
from app.models.schemas import QuestionGenRequest, GeneratedQuestion
from app.config import settings

# Comprehensive dynamic knowledge bank for skills & categories
DOMAIN_TEMPLATES = {
    "react": {
        "beginner": {
            "title": "React Component Lifecycle and State",
            "desc": "Explain the difference between state and props in React, and how the useState hook manages local component re-rendering.",
            "concepts": ["State is mutable and local", "Props are read-only and passed down", "useState triggers re-render", "Unidirectional data flow"],
            "criteria": "Evaluates candidate's foundational grasp of React's reactive rendering model."
        },
        "intermediate": {
            "title": "React Hooks and Performance Optimization",
            "desc": "How do useMemo, useCallback, and React.memo prevent unnecessary renders? Provide an architectural scenario where overusing them hurts performance.",
            "concepts": ["useMemo caches computed values", "useCallback memoizes function references", "React.memo skips render on unchanged props", "Memory and equality check overhead"],
            "criteria": "Measures practical experience with React render cycles, reconciliation, and profiling."
        },
        "advanced": {
            "title": "React Fiber Architecture and Concurrent Mode",
            "desc": "Explain how the React Fiber reconciliation engine achieves non-blocking rendering, interruptible work, and prioritizes lane-based updates.",
            "concepts": ["Fiber nodes as units of work", "Two phases: render (reconciliation) and commit", "Lanes scheduling priority", "Time slicing and cooperative multitasking"],
            "criteria": "Assesses deep internal architectural knowledge of React rendering pipeline."
        }
    },
    "node.js": {
        "beginner": {
            "title": "Node.js Event Loop Fundamentals",
            "desc": "Explain the single-threaded asynchronous nature of Node.js and the purpose of the event loop.",
            "concepts": ["Single main thread with libuv worker pool", "Non-blocking I/O", "Call stack, event loop, and callback queue", "Avoid blocking the event loop"],
            "criteria": "Tests basic grasp of Node.js concurrency model."
        },
        "intermediate": {
            "title": "Node.js Streams and Backpressure Handling",
            "desc": "What are the four types of streams in Node.js, and how does the pipeline handle backpressure when reading fast data into a slow sink?",
            "concepts": ["Readable, Writable, Duplex, Transform", "HighWaterMark buffer threshold", "stream.pipeline handles errors & cleanup", "pause and resume flow control"],
            "criteria": "Verifies ability to build memory-efficient high-throughput backend services."
        },
        "advanced": {
            "title": "Node.js Microservices Clustering and Memory Profiling",
            "desc": "How would you detect, isolate, and debug a native memory leak or garbage collection thrashing in a distributed cluster of Node.js worker threads?",
            "concepts": ["V8 heap snapshots and allocation timelines", "WeakRefs and event listener retention", "Node cluster module / PM2 multi-process IPC", "GC pause times and metrics"],
            "criteria": "Evaluates senior-level backend reliability, diagnostics, and scalability engineering."
        }
    },
    "sql": {
        "beginner": {
            "title": "SQL Indexing and Primary Keys",
            "desc": "What is the primary difference between a clustered and non-clustered index in a relational database?",
            "concepts": ["Clustered index dictates physical storage order", "Only one clustered index per table", "Non-clustered index is a secondary lookup B-tree", "Tradeoff between query speed and write overhead"],
            "criteria": "Tests core relational database index foundations."
        },
        "intermediate": {
            "title": "Database Transactions and ACID Properties",
            "desc": "Detail the 4 ACID guarantees and explain isolation levels (Read Committed vs Repeatable Read vs Serializable) with potential concurrency phenomena (dirty read, phantom read).",
            "concepts": ["Atomicity, Consistency, Isolation, Durability", "Dirty reads, non-repeatable reads, phantom reads", "Multi-version concurrency control (MVCC)", "Locking mechanisms"],
            "criteria": "Assesses transactional integrity and concurrency control skills."
        },
        "advanced": {
            "title": "Distributed Database Sharding and Consensus",
            "desc": "When partitioning a multi-terabyte SQL database across horizontal shards, how do you handle cross-shard transactions, distributed deadlocks, and consistency under CAP theorem?",
            "concepts": ["Hash vs range sharding", "Two-Phase Commit (2PC) / Saga pattern", "Replication lag and eventual consistency", "CAP theorem tradeoffs"],
            "criteria": "Tests enterprise database architecture and distributed systems engineering."
        }
    },
    "python": {
        "beginner": {
            "title": "Python Data Structures and Memory Model",
            "desc": "Compare Python lists, tuples, and sets in terms of mutability, internal hashing, and time complexity for membership testing.",
            "concepts": ["Lists are mutable dynamic arrays", "Tuples are immutable sequences", "Sets use hash tables for O(1) average lookup", "Hashability requirement"],
            "criteria": "Verifies fundamental Python language fundamentals."
        },
        "intermediate": {
            "title": "Python Concurrency and GIL Mechanics",
            "desc": "Explain the Global Interpreter Lock (GIL) in CPython. How do multiprocessing, multithreading, and asyncio differ for I/O-bound vs CPU-bound tasks?",
            "concepts": ["GIL prevents concurrent bytecode execution on multiple cores", "Threading is effective for I/O-bound with syscall release", "Multiprocessing bypasses GIL via separate heaps", "asyncio single-threaded cooperative event loop"],
            "criteria": "Tests proficiency in choosing proper Python concurrency paradigms."
        },
        "advanced": {
            "title": "Python Metaclasses, Descriptors, and V8/C-Extension Interop",
            "desc": "Explain the descriptor protocol (__get__, __set__) and how Python metaclasses enable framework-level ORM attribute binding and validation.",
            "concepts": ["Descriptor protocol controls attribute access", "Metaclasses inherit from type to customize class creation", "__init_subclass__ alternative", "Dynamic attribute resolution via __mro__"],
            "criteria": "Evaluates Python internals and advanced metaprogramming skills."
        }
    }
}

class QuestionGenerator:
    @staticmethod
    def generate_questions(req: QuestionGenRequest) -> List[GeneratedQuestion]:
        questions: List[GeneratedQuestion] = []
        target_skills = [s.lower().strip() for s in req.required_skills]
        if not target_skills:
            target_skills = ["general engineering", "problem solving"]

        diff = req.experience_level.lower()
        if diff not in ["beginner", "intermediate", "advanced", "expert"]:
            diff = "intermediate"
        diff_key = "advanced" if diff == "expert" else diff

        cat = req.category.lower()

        # Generate targeted questions based on requested skills
        for skill in target_skills:
            matched_key = None
            for k in DOMAIN_TEMPLATES.keys():
                if k in skill or skill in k:
                    matched_key = k
                    break

            if matched_key and diff_key in DOMAIN_TEMPLATES[matched_key]:
                tmpl = DOMAIN_TEMPLATES[matched_key][diff_key]
                questions.append(GeneratedQuestion(
                    title=f"[{skill.upper()}] {tmpl['title']}",
                    description=tmpl["desc"],
                    category=req.category.upper(),
                    difficulty=diff.upper(),
                    skill_evaluated=skill.title(),
                    expected_concepts=tmpl["concepts"],
                    evaluation_criteria=tmpl["criteria"],
                    max_score=100.0,
                    time_limit_seconds=180
                ))

            if len(questions) >= req.num_questions:
                break

        # If more questions are required, generate role & behavioral/situational questions
        if len(questions) < req.num_questions:
            if "hr" in cat or "behavioral" in cat:
                behavioral_templates = [
                    (
                        "Conflict Resolution and Engineering Disagreement",
                        "Describe a situation where you had a strong technical disagreement with a teammate or lead regarding architecture. How did you resolve it objectively?",
                        ["Objective data over opinion", "Active listening and understanding counter-arguments", "Prototyping / benchmark spikes", "Disagree and commit for team cohesion"],
                        "Evaluates emotional intelligence, collaborative mindset, and constructive communication.",
                        "Team Collaboration"
                    ),
                    (
                        "Handling Critical Production Incident & Post-Mortem",
                        "Tell me about a time a system you owned experienced a severe outage or production failure. What immediate steps did you take, and how did you lead the blameless post-mortem?",
                        ["Triage, containment, and communication", "Root cause analysis (5 Whys)", "Blameless post-mortem culture", "Preventative automated testing and monitoring"],
                        "Measures ownership, resilience under pressure, and systematic incident remediation.",
                        "Incident Management"
                    )
                ]
                for title, desc, concepts, crit, skill in behavioral_templates:
                    questions.append(GeneratedQuestion(
                        title=f"[BEHAVIORAL] {title}",
                        description=desc,
                        category="BEHAVIORAL",
                        difficulty=diff.upper(),
                        skill_evaluated=skill,
                        expected_concepts=concepts,
                        evaluation_criteria=crit,
                        max_score=100.0,
                        time_limit_seconds=240
                    ))
                    if len(questions) >= req.num_questions:
                        break

        # Fallback dynamic generator for specialized titles
        counter = 1
        while len(questions) < req.num_questions:
            target_sk = target_skills[(counter - 1) % len(target_skills)]
            questions.append(GeneratedQuestion(
                title=f"Technical Evaluation: {req.job_title} - {target_sk.title()} Practical Scenario {counter}",
                description=f"In the context of {req.job_title}, describe how you would design, implement, and validate a reliable feature using {target_sk.title()}. What edge cases and performance boundaries must be addressed?",
                category=req.category.upper(),
                difficulty=diff.upper(),
                skill_evaluated=target_sk.title(),
                expected_concepts=[
                    f"Core principles of {target_sk.title()}",
                    "Modular architecture and separation of concerns",
                    "Error handling, input validation, and boundary conditions",
                    "Scalability and testing strategies"
                ],
                evaluation_criteria=f"Evaluates candidate's end-to-end practical reasoning in {target_sk.title()} within {req.job_title}.",
                max_score=100.0,
                time_limit_seconds=180
            ))
            counter += 1

        return questions[:req.num_questions]
