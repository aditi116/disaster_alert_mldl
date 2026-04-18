package com.disasteralert.ml.service;

import com.disasteralert.entity.Alert;
import com.disasteralert.ml.dto.CredibilityResultDTO;
import com.disasteralert.repository.AlertRepository;
import com.disasteralert.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class NaiveBayesCredibilityService {

    private static final Logger log = LoggerFactory.getLogger(NaiveBayesCredibilityService.class);

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private UserRepository userRepository;

    private static final String[] CLASSES = {"CREDIBLE", "SUSPICIOUS", "SPAM"};

    private static final Set<String> STOPWORDS = Set.of(
            "the", "is", "a", "an", "in", "on", "at", "to", "for", "of",
            "and", "or", "but", "it", "this", "that"
    );

    // Word frequencies per class: class -> word -> count
    private final Map<String, Map<String, Integer>> wordFreq = new HashMap<>();

    // Total word count per class (for Laplace denominator)
    private final Map<String, Integer> totalWordsPerClass = new HashMap<>();

    // Vocabulary across all classes
    private final Set<String> vocabulary = new HashSet<>();

    // Feature bin counts per class: class -> bin index -> count
    // postCountBin has 3 bins (0,1,2), hourBin has 4 bins (0,1,2,3)
    private final Map<String, int[]> postCountBinCounts = new HashMap<>();
    private final Map<String, int[]> hourBinCounts = new HashMap<>();

    // Prior counts
    private final Map<String, Integer> classCounts = new HashMap<>();
    private int totalSamples = 0;

    private static final double ALPHA = 1.0; // Laplace smoothing

    @PostConstruct
    public void train() {
        log.info("Training Naive Bayes Credibility classifier...");

        // Hardcoded training data: description, postCountBin, hourBin
        Map<String, List<String[]>> trainingData = new LinkedHashMap<>();

        trainingData.put("CREDIBLE", List.of(
                new String[]{"Major fire downtown building casualties reported", "2", "2"},
                new String[]{"Flood waters rising rapidly on riverside road near bridge", "2", "1"},
                new String[]{"Building collapse people trapped need rescue immediately", "1", "2"},
                new String[]{"Gas pipeline explosion evacuate surrounding area now", "2", "2"},
                new String[]{"Landslide blocking highway emergency vehicles cannot pass", "1", "1"},
                new String[]{"Severe flooding elderly residents need evacuation help", "2", "3"},
                new String[]{"Road accident multiple injuries on expressway near toll", "1", "1"},
                new String[]{"Chemical spill factory fumes affecting residents health", "2", "2"},
                new String[]{"Earthquake buildings showing structural damage cracks", "2", "1"},
                new String[]{"Wildfire spreading towards residential area evacuate now", "2", "3"},
                new String[]{"Large fire warehouse spreading to homes wind worsening", "2", "2"},
                new String[]{"Flash flood warning river water level dangerously high", "2", "1"},
                new String[]{"Collapsed bridge vehicles stranded people need help now", "1", "2"},
                new String[]{"Medical emergency school students collapsed unknown illness", "1", "1"},
                new String[]{"Power transformer exploded widespread outage eastern district", "1", "2"}
        ));

        trainingData.put("SUSPICIOUS", List.of(
                new String[]{"Something strange near old factory not sure what", "0", "0"},
                new String[]{"Think there might be fire somewhere in north area", "0", "3"},
                new String[]{"Heard loud sounds could be explosion not confirmed", "0", "2"},
                new String[]{"Smoke visible direction unclear if serious or not", "0", "2"},
                new String[]{"Flooding might be happening near river check yourself", "0", "0"},
                new String[]{"Not sure power out in some areas of city possibly", "0", "3"},
                new String[]{"Someone told me accident but could not confirm it", "0", "2"},
                new String[]{"Water coming from ground maybe pipe maybe flood unclear", "0", "1"},
                new String[]{"Ambulances near school area unclear what situation is", "0", "1"},
                new String[]{"Possibly small fire in basement saw little smoke", "0", "0"},
                new String[]{"People running from market reason unknown might be danger", "0", "1"},
                new String[]{"Unusual activity near warehouse looks suspicious could be something", "0", "0"},
                new String[]{"Gas smell in colony but could not smell it myself", "0", "3"},
                new String[]{"Traffic jam near bridge maybe accident or construction", "0", "2"},
                new String[]{"Possibly flooding in lower areas road looks ok from here", "0", "1"}
        ));

        trainingData.put("SPAM", List.of(
                new String[]{"Free food giveaway at community center come get it", "0", "1"},
                new String[]{"Visit website for best disaster preparedness products", "0", "2"},
                new String[]{"Testing testing this is just a test please ignore", "0", "1"},
                new String[]{"Buy emergency supplies from store best quality guaranteed", "0", "1"},
                new String[]{"Fake alert this is not real do not believe this", "0", "0"},
                new String[]{"Nothing happening everything fine stop worrying now", "0", "2"},
                new String[]{"Posting random stuff to test system no emergency", "0", "1"},
                new String[]{"This app is terrible nobody responds to real alerts", "0", "3"},
                new String[]{"Please delete my account no longer want to use this", "0", "2"},
                new String[]{"Hello world first alert post on this platform today", "0", "2"},
                new String[]{"Alert alert alert no real emergency just testing", "0", "2"},
                new String[]{"This platform needs better UI please update the design", "0", "1"},
                new String[]{"My cat stuck in tree this is real emergency help", "0", "0"},
                new String[]{"I am bored nothing to do so posting this alert", "0", "3"},
                new String[]{"Disaster platform is bad waste of time and money", "0", "3"}
        ));

        // Initialize structures
        for (String cls : CLASSES) {
            wordFreq.put(cls, new HashMap<>());
            totalWordsPerClass.put(cls, 0);
            postCountBinCounts.put(cls, new int[3]); // bins 0,1,2
            hourBinCounts.put(cls, new int[4]);       // bins 0,1,2,3
            classCounts.put(cls, 0);
        }

        // Process training data
        for (String cls : CLASSES) {
            List<String[]> samples = trainingData.get(cls);
            classCounts.put(cls, samples.size());
            totalSamples += samples.size();

            for (String[] sample : samples) {
                String description = sample[0];
                int postCountBin = Integer.parseInt(sample[1]);
                int hourBin = Integer.parseInt(sample[2]);

                // Process bag-of-words
                List<String> words = tokenize(description);
                for (String word : words) {
                    vocabulary.add(word);
                    wordFreq.get(cls).merge(word, 1, Integer::sum);
                    totalWordsPerClass.merge(cls, 1, Integer::sum);
                }

                // Process feature bins
                postCountBinCounts.get(cls)[postCountBin]++;
                hourBinCounts.get(cls)[hourBin]++;
            }
        }

        log.info("Naive Bayes training complete. Vocabulary size: {}, Total samples: {}",
                vocabulary.size(), totalSamples);
    }

    public CredibilityResultDTO classify(Alert alert) {
        // Extract features from the alert
        List<String> words = tokenize(alert.getDescription() != null ? alert.getDescription() : "");

        Long userId = alert.getUser().getId();
        Long postCount = alertRepository.countByUser_Id(userId);
        int postCountBin = computePostCountBin(postCount);

        int hourBin = computeHourBin(alert.getCreatedAt() != null
                ? alert.getCreatedAt().getHour()
                : java.time.LocalDateTime.now().getHour());

        // Compute log probabilities for each class
        double[] logProbs = new double[CLASSES.length];
        int vocabSize = vocabulary.size();

        for (int i = 0; i < CLASSES.length; i++) {
            String cls = CLASSES[i];
            double logPrior = Math.log((double) classCounts.get(cls) / totalSamples);

            // Bag-of-words likelihood with Laplace smoothing
            double logLikelihood = 0.0;
            int totalWords = totalWordsPerClass.get(cls);
            Map<String, Integer> classWordFreq = wordFreq.get(cls);

            for (String word : words) {
                int wordCount = classWordFreq.getOrDefault(word, 0);
                logLikelihood += Math.log((wordCount + ALPHA) / (totalWords + ALPHA * vocabSize));
            }

            // Post count bin feature likelihood
            int postBinCount = postCountBinCounts.get(cls)[postCountBin];
            int classSampleCount = classCounts.get(cls);
            logLikelihood += Math.log((postBinCount + ALPHA) / (classSampleCount + ALPHA * 3));

            // Hour bin feature likelihood
            int hourBinCount = hourBinCounts.get(cls)[hourBin];
            logLikelihood += Math.log((hourBinCount + ALPHA) / (classSampleCount + ALPHA * 4));

            logProbs[i] = logPrior + logLikelihood;
        }

        // Softmax to get confidence
        float[] confidences = softmax(logProbs);

        // Find the class with the highest confidence
        int bestIdx = 0;
        for (int i = 1; i < confidences.length; i++) {
            if (confidences[i] > confidences[bestIdx]) {
                bestIdx = i;
            }
        }

        CredibilityResultDTO result = new CredibilityResultDTO();
        result.setAlertId(alert.getId());
        result.setLabel(CLASSES[bestIdx]);
        result.setConfidence(confidences[bestIdx]);

        log.info("Alert {} classified as {} with confidence {}", alert.getId(), CLASSES[bestIdx], confidences[bestIdx]);
        return result;
    }

    private List<String> tokenize(String text) {
        String[] tokens = text.toLowerCase().split("[\\s\\p{Punct}]+");
        List<String> result = new ArrayList<>();
        for (String token : tokens) {
            if (!token.isBlank() && !STOPWORDS.contains(token)) {
                result.add(token);
            }
        }
        return result;
    }

    private int computePostCountBin(Long postCount) {
        if (postCount <= 2) return 0;
        if (postCount <= 10) return 1;
        return 2;
    }

    private int computeHourBin(int hour) {
        if (hour <= 6) return 0;
        if (hour <= 12) return 1;
        if (hour <= 18) return 2;
        return 3;
    }

    private float[] softmax(double[] logProbs) {
        // Find max for numerical stability
        double max = logProbs[0];
        for (double v : logProbs) {
            if (v > max) max = v;
        }

        double[] exps = new double[logProbs.length];
        double sumExp = 0.0;
        for (int i = 0; i < logProbs.length; i++) {
            exps[i] = Math.exp(logProbs[i] - max);
            sumExp += exps[i];
        }

        float[] result = new float[logProbs.length];
        for (int i = 0; i < logProbs.length; i++) {
            result[i] = (float) (exps[i] / sumExp);
        }
        return result;
    }
}
