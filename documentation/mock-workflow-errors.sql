-- Mock data za workflow greške na svim stage-ovima
-- Ova skripta će kreirati test podatke u originalnim tabelama koji će se reflektovati u workflow_execution_log_summary materialized view

-- NAPOMENA: workflow_execution_log_summary je materialized view koji se kreira iz:
-- workflow_run, workflow_step, fluxdata, fetchinghistory

-- Mock podaci za greške na Fetching stage-u (samo fetching_id postoji)
INSERT INTO workflow_execution_log_summary (
    flux_id, flux_name, run_number, status, progress, 
    started_at, completed_at, duration_active, duration_seconds,
    content_count, steps, last_stage, 
    fetching_id, processing_id, normalization_id, refinement_id, calculation_id
) VALUES 
-- Greške na Fetching stage-u
(105, 'Test Flux - Fetching Errors', 1001, 'Failed', 20, 
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 50 minutes', '00:10:00', 600,
 0, '0/5', 'Fetching', 
 99001, NULL, NULL, NULL, NULL),
 
(105, 'Test Flux - Fetching Errors', 1002, 'Failed', 15, 
 NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 45 minutes', '00:15:00', 900,
 0, '0/5', 'Fetching', 
 99002, NULL, NULL, NULL, NULL),

-- Greške na Processing stage-u (fetching_id i processing_id postoje)
(106, 'Test Flux - Processing Errors', 1003, 'Failed', 40, 
 NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 40 minutes', '00:20:00', 1200,
 3, '1/5', 'Processing', 
 99003, 88001, NULL, NULL, NULL),
 
(106, 'Test Flux - Processing Errors', 1004, 'Failed', 35, 
 NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 35 minutes', '00:25:00', 1500,
 2, '1/5', 'Processing', 
 99004, 88002, NULL, NULL, NULL),

-- Dodatne greške na različitim stage-ovima za raznolikost
(107, 'Test Flux - Mixed Errors', 1005, 'Error', 18, 
 NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 50 minutes', '00:10:00', 600,
 0, '0/5', 'Fetching', 
 99005, NULL, NULL, NULL, NULL),

(107, 'Test Flux - Mixed Errors', 1006, 'Error', 38, 
 NOW() - INTERVAL '7 hours', NOW() - INTERVAL '6 hours 30 minutes', '00:30:00', 1800,
 1, '1/5', 'Processing', 
 99006, 88003, NULL, NULL, NULL),

(107, 'Test Flux - Mixed Errors', 1007, 'Failed', 85, 
 NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours 20 minutes', '00:40:00', 2400,
 5, '4/5', 'Calculation', 
 99007, 88004, 77001, 66001, 55001);

-- Provjerimo da li su podaci uspješno dodati
SELECT flux_name, status, last_stage, 
       CASE 
         WHEN processing_id IS NULL THEN 'Failed at Fetching'
         WHEN normalization_id IS NULL THEN 'Failed at Processing'
         WHEN refinement_id IS NULL THEN 'Failed at Normalization'
         WHEN calculation_id IS NULL THEN 'Failed at Refinement'
         ELSE 'Failed at Calculation'
       END as failure_point
FROM workflow_execution_log_summary 
WHERE flux_id IN (105, 106, 107)
ORDER BY id DESC;